// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AdminOwnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IAEOS.sol";
import "./interfaces/IUSDT.sol";
import "./interfaces/ILiquidity.sol";
import "./libraries/VestingMath.sol";

/**
 * @title AeosVestingAdvisors
 * @dev Advisors & Partnerships vesting module (5%, 50M AEOS)
 * - Public purchase at 0.2 USDT per AEOS
 * - 12 months cliff
 * - 2.5% monthly unlock (48 months total)
 * - Per-investment release (no looping, gas efficient)
 */
contract AeosVestingAdvisors is AdminOwnable, ReentrancyGuard {
    using SafeERC20 for IAEOS;
    using SafeERC20 for IUSDT;

    // ==================== STATE VARIABLES ====================

    // Constants
    uint256 public constant ALLOCATION = 50_000_000 * 1e18; // 50M AEOS
    uint256 private constant BPS = 10000; // Basis points denominator (10000 bps = 100%)

    // Token Interfaces (set by constructor, not hardcoded)
    IAEOS public aeosToken;
    IUSDT public usdtToken;
    ILiquidity public liquidity;

    // Struct
    struct Investment {
        uint256 amount; // AEOS amount purchased
        uint256 released; // AEOS claimed so far
        uint256 purchaseTime; // When purchased
        uint256 releasedTime; // When last claimed
        uint256 cliffEnd; // Cliff period end
        uint256 vestingEnd; // Full vesting end
        bool isCompleted; // True when released >= amount OR block.timestamp >= vestingEnd
    }

    // Mappings & Tracking
    mapping(address => Investment[]) public investments;
    uint256 public totalSold;
    uint256 public totalAllocated; // Track allocated/reserved AEOS (prevents oversales)
    uint256 public totalUsdtRaised;

    // Configuration (Owner-configurable with defaults)
    // ⚠️ TESTING VALUES BELOW - REVERT TO PRODUCTION BEFORE MAINNET
    uint256 public vestingPrice = 0.2 * 1e18; // 0.2 USDT per AEOS
    uint256 public minimumInvestmentAmount = 10 * 1e18; // Min 10 USDT

    // CLIFF PERIOD: Default 12 months (360 days), Testing 36 minutes
    // PRODUCTION: uint256 public cliffPeriodSeconds = 360 days;
    // TESTING:    uint256 public cliffPeriodSeconds = 36 minutes;
    uint256 public cliffPeriodSeconds = 36 minutes; // 2,160 seconds (testing) | 31,104,000 seconds (production: 360 days)

    uint256 public unlockPercentPerPeriod = 250; // 2.5% per period (250 bps)

    // VESTING END TIME: Default 48 months total, Testing 4 hours total
    // Note: vestingEnd is calculated as: block.timestamp + vestingEndSeconds
    // PRODUCTION: uint256 public vestingEndSeconds = 1440 days;
    // TESTING:    uint256 public vestingEndSeconds = 4 hours;
    uint256 public vestingEndSeconds = 4 hours; // 14,400 seconds (testing) | 124,416,000 seconds (production: 1440 days)

    // WITHDRAWAL PERIOD (unlock frequency): Default 90 days, Testing 9 minutes
    // PRODUCTION: uint256 public withdrawalPeriod = 90 days;
    // TESTING:    uint256 public withdrawalPeriod = 9 minutes;
    uint256 public withdrawalPeriod = 9 minutes; // 540 seconds (testing) | 7,776,000 seconds (production: 90 days)
    uint256 public slippageBps = 2500; // 25% slippage tolerance (2500 bps = 25%)
    uint256 public usdtToLiquidityBps = 8000; // 80% of USDT to liquidity (8000 bps = 80%)
    uint256 public usdtToTreasuryBps = 2000; // 20% of USDT to treasury (2000 bps = 20%)

    // Wallets
    address public treasuryWallet;

    // ==================== EVENTS ====================

    event AdvisorVestingPurchased(address indexed advisor, uint256 usdtAmount, uint256 aeosAmount, uint256 cliffEnd);
    event AdvisorTokensReleased(address indexed advisor, uint256 investmentIndex, uint256 amount);
    event InvestmentCompleted(address indexed advisor, uint256 investmentIndex);
    event TreasuryWalletUpdated(address indexed newWallet);
    event UsdtWithdrawn(address indexed to, uint256 amount);
    event LiquidityRoutingFailed(string reason);
    event VestingConfigurationUpdated(
        uint256 newVestingPrice,
        uint256 newMinInvestment,
        uint256 newCliffMonths,
        uint256 newUnlockPercent,
        uint256 newVestingMonths,
        uint256 newWithdrawalPeriod
    );

    // ==================== CONSTRUCTOR ====================

    constructor(address _aeosToken, address _usdtToken)  {
        require(_aeosToken != address(0), "Invalid AEOS token");
        require(_usdtToken != address(0), "Invalid USDT token");
        aeosToken = IAEOS(_aeosToken);
        usdtToken = IUSDT(_usdtToken);
        treasuryWallet = msg.sender; // Default to deployer, can be updated via setTreasuryWallet()
    }

    // ==================== PUBLIC/EXTERNAL FUNCTIONS ====================

    /**
     * @dev Public purchase of advisor vesting
     * User pays in USDT; AEOS will be available when owner deposits liquidity
     */
    function buyAdvisorVesting(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount >= minimumInvestmentAmount, "Below minimum investment");

        uint256 aeosAmount = (usdtAmount * 1e18) / vestingPrice;

        require(totalSold + aeosAmount <= ALLOCATION, "Exceeds advisor allocation");

        usdtToken.safeTransferFrom(msg.sender, address(this), usdtAmount);

        // Split USDT: configurable basis points (default 8000 bps = 80% to liquidity, 2000 bps = 20% to treasury)
        uint256 usdtForLiquidity = (usdtAmount * usdtToLiquidityBps) / BPS;
        uint256 usdtForTreasury = (usdtAmount * usdtToTreasuryBps) / BPS;

        uint256 cliffEnd = block.timestamp + cliffPeriodSeconds;
        // TESTING: Use vestingEndSeconds directly | PRODUCTION: Change to (totalVestingMonths * 30 days)
        uint256 vestingEnd = block.timestamp + vestingEndSeconds;

        investments[msg.sender].push(Investment({
            amount: aeosAmount,
            released: 0,
            purchaseTime: block.timestamp,
            releasedTime: block.timestamp,
            cliffEnd: cliffEnd,
            vestingEnd: vestingEnd,
            isCompleted: false
        }));

        totalSold += aeosAmount;
        totalAllocated += aeosAmount; // Reserve AEOS for this investment
        totalUsdtRaised += usdtAmount;

        // Try to route 80% to liquidity pool; if fails, send 100% to treasury
        bool liquidityRoutingSuccessful = false;
        if (
            address(liquidity) != address(0) &&
            liquidity.TOKENID() != 0 &&
            usdtForLiquidity > 0
        ) {
            usdtToken.forceApprove(address(liquidity), usdtForLiquidity);
            try liquidity.addLiquidityUSDT(usdtForLiquidity, uint24(slippageBps)) returns (uint256 lpAdded) {
                if (lpAdded > 0) {
                    liquidityRoutingSuccessful = true;
                } else {
                    emit LiquidityRoutingFailed("addLiquidityUSDT returned 0");
                }
            } catch Error(string memory reason) {
                emit LiquidityRoutingFailed(reason);
            } catch {
                emit LiquidityRoutingFailed("Unknown error");
            }
        }

        // Transfer USDT to treasury: 20% if liquidity succeeded, 100% otherwise
        uint256 treasuryAmount = liquidityRoutingSuccessful ? usdtForTreasury : usdtAmount;
        if (treasuryAmount > 0) {
            usdtToken.safeTransfer(treasuryWallet, treasuryAmount);
        }

        emit AdvisorVestingPurchased(msg.sender, usdtAmount, aeosAmount, cliffEnd);
    }

    /**
     * @dev Release tokens from a single investment (gas efficient)
     * User specifies which investment to claim from
     */
    function releaseAdvisorTokens(uint256 investmentIndex) external nonReentrant returns (uint256) {
        require(investmentIndex < investments[msg.sender].length, "Investment index out of bounds");
        Investment storage inv = investments[msg.sender][investmentIndex];

        require(!inv.isCompleted, "Investment already completed");

        uint256 claimable = getClaimableAmount(msg.sender, investmentIndex);
        require(claimable > 0, "No unlocked tokens");

        inv.released += claimable;
        totalAllocated -= claimable; // Release from allocation upon claim
        inv.releasedTime = block.timestamp;

        // Mark as completed if all tokens released or vesting expired
        if (inv.released >= inv.amount || block.timestamp >= inv.vestingEnd) {
            inv.isCompleted = true;
            emit InvestmentCompleted(msg.sender, investmentIndex);
        }

        aeosToken.safeTransfer(msg.sender, claimable);
        emit AdvisorTokensReleased(msg.sender, investmentIndex, claimable);

        return claimable;
    }

    /**
     * @dev Release from multiple investments in one call (batch release)
     */
    function batchReleaseTokens(uint256[] calldata investmentIndices) external nonReentrant returns (uint256) {
        require(investmentIndices.length > 0, "No investments specified");
        require(investmentIndices.length <= 50, "Max 50 investments per batch");

        uint256 totalToRelease = 0;

        for (uint256 i = 0; i < investmentIndices.length; i++) {
            uint256 index = investmentIndices[i];
            require(index < investments[msg.sender].length, "Investment index out of bounds");

            Investment storage inv = investments[msg.sender][index];

            if (inv.isCompleted) continue;

            uint256 claimable = getClaimableAmount(msg.sender, index);
            if (claimable == 0) continue;

            inv.released += claimable;
            inv.releasedTime = block.timestamp;
            totalAllocated -= claimable; // Release from allocation upon claim

            if (inv.released >= inv.amount || block.timestamp >= inv.vestingEnd) {
                inv.isCompleted = true;
                emit InvestmentCompleted(msg.sender, index);
            }

            totalToRelease += claimable;
        }

        require(totalToRelease > 0, "No unlocked tokens");

        aeosToken.safeTransfer(msg.sender, totalToRelease);
        emit AdvisorTokensReleased(msg.sender, 0, totalToRelease); // Index 0 indicates batch

        return totalToRelease;
    }

    // ==================== VIEW FUNCTIONS (Getters) ====================

    /**
     * @dev Get claimable amount for a specific investment (no looping)
     */
    function getClaimableAmount(address advisor, uint256 investmentIndex) public view returns (uint256) {
        require(investmentIndex < investments[advisor].length, "Investment index out of bounds");
        Investment storage inv = investments[advisor][investmentIndex];

        if (inv.isCompleted) return 0;

        uint256 unlocked = getUnlockedAmount(inv.amount, inv.cliffEnd, inv.vestingEnd);

        return unlocked > inv.released ? unlocked - inv.released : 0;
    }

    /**
     * @dev Get withdrawal period info for an investment
     * Shows: months elapsed, next eligible withdrawal date, months since last withdrawal
     */
    function getWithdrawalPeriodInfo(address advisor, uint256 investmentIndex) external view returns (
        uint256 monthsSinceCliff,
        uint256 monthsSinceLastWithdrawal,
        uint256 nextEligibleWithdrawalTime,
        bool canWithdrawNow,
        uint256 monthlyPeriodsPending
    ) {
        require(investmentIndex < investments[advisor].length, "Investment index out of bounds");
        Investment storage inv = investments[advisor][investmentIndex];

        uint256 now_ = block.timestamp;

        // Before cliff: no months available
        if (now_ < inv.cliffEnd) {
            return (0, 0, inv.cliffEnd, false, 0);
        }

        // After cliff: calculate periods
        uint256 secondsSinceCliff = now_ - inv.cliffEnd;
        monthsSinceCliff = secondsSinceCliff / withdrawalPeriod;

        // Periods since last release
        uint256 secondsSinceLastRelease = now_ - inv.releasedTime;
        monthsSinceLastWithdrawal = secondsSinceLastRelease / withdrawalPeriod;

        // Next eligible withdrawal: lastReleaseTime + (periods pending × withdrawalPeriod)
        uint256 periodsPendingForNextEligible = (secondsSinceLastRelease / withdrawalPeriod); // Round down
        nextEligibleWithdrawalTime = inv.releasedTime + (periodsPendingForNextEligible * withdrawalPeriod) + withdrawalPeriod;

        // Can withdraw if at least 1 full period has passed since last withdrawal
        canWithdrawNow = monthsSinceLastWithdrawal > 0;

        // Periods that can be claimed in this withdrawal
        monthlyPeriodsPending = monthsSinceLastWithdrawal;

        return (monthsSinceCliff, monthsSinceLastWithdrawal, nextEligibleWithdrawalTime, canWithdrawNow, monthlyPeriodsPending);
    }

    /**
     * @dev Get expected withdrawal amount based on time gap
     * Example: if 65 days passed with 30-day periods, user can withdraw 2.5% × floor(65/30) = 5%
     */
    function getExpectedWithdrawalAmount(address advisor, uint256 investmentIndex) external view returns (
        uint256 claimableAmount,
        uint256 periodsPending,
        uint256 percentageUnlocked
    ) {
        require(investmentIndex < investments[advisor].length, "Investment index out of bounds");
        Investment storage inv = investments[advisor][investmentIndex];

        if (block.timestamp < inv.cliffEnd || inv.isCompleted) {
            return (0, 0, 0);
        }

        uint256 secondsSinceLastRelease = block.timestamp - inv.releasedTime;
        periodsPending = secondsSinceLastRelease / withdrawalPeriod;

        if (periodsPending == 0) {
            return (0, 0, 0);
        }

        // Each period = configured unlock percent
        percentageUnlocked = periodsPending * unlockPercentPerPeriod;
        if (percentageUnlocked > BPS) {
            percentageUnlocked = BPS; // Cap at 100%
        }

        claimableAmount = (inv.amount * percentageUnlocked) / BPS;
        if (claimableAmount + inv.released > inv.amount) {
            claimableAmount = inv.amount - inv.released;
        }

        return (claimableAmount, periodsPending, percentageUnlocked);
    }

    /**
     * @dev Get total claimable across all active investments
     */
    function getTotalClaimable(address advisor) external view returns (uint256) {
        Investment[] storage advisorInvests = investments[advisor];
        uint256 totalClaimable = 0;

        for (uint256 i = 0; i < advisorInvests.length; i++) {
            if (!advisorInvests[i].isCompleted) {
                totalClaimable += getClaimableAmount(advisor, i);
            }
        }

        return totalClaimable;
    }

    /**
     * @dev Get summary of all investments
     */
    function getAdvisorSummary(address advisor) external view returns (
        uint256 totalPurchased,
        uint256 totalReleased,
        uint256 totalClaimable,
        uint256 investmentCount,
        uint256 completedCount
    ) {
        Investment[] storage advisorInvests = investments[advisor];
        investmentCount = advisorInvests.length;

        for (uint256 i = 0; i < advisorInvests.length; i++) {
            Investment storage inv = advisorInvests[i];
            totalPurchased += inv.amount;
            totalReleased += inv.released;

            if (!inv.isCompleted) {
                totalClaimable += getClaimableAmount(advisor, i);
            }

            if (inv.isCompleted) {
                completedCount++;
            }
        }

        return (totalPurchased, totalReleased, totalClaimable, investmentCount, completedCount);
    }

    /**
     * @dev Get full details of a specific investment
     */
    function getInvestmentDetails(address advisor, uint256 index) external view returns (
        uint256 amount,
        uint256 released,
        uint256 claimable,
        uint256 purchaseTime,
        uint256 releasedTime,
        uint256 cliffEnd,
        uint256 vestingEnd,
        bool isCompleted
    ) {
        require(index < investments[advisor].length, "Investment index out of bounds");
        Investment storage inv = investments[advisor][index];

        uint256 claimableAmount = getClaimableAmount(advisor, index);

        return (
            inv.amount,
            inv.released,
            claimableAmount,
            inv.purchaseTime,
            inv.releasedTime,
            inv.cliffEnd,
            inv.vestingEnd,
            inv.isCompleted
        );
    }

    /**
     * @dev Get count of investments for an address
     */
    function getInvestmentCount(address advisor) external view returns (uint256) {
        return investments[advisor].length;
    }

    /**
     * @dev Get available AEOS balance (total, not reserved/allocated)
     */
    function getAvailableAeos() external view returns (uint256) {
        return aeosToken.balanceOf(address(this));
    }

    /**
     * @dev Get available AEOS for NEW SALES (balance - already allocated)
     */
    function getAvailableAeosForSale() external view returns (uint256) {
        uint256 balance = aeosToken.balanceOf(address(this));
        return balance > totalAllocated ? balance - totalAllocated : 0;
    }

    /**
     * @dev Get available USDT balance
     */
    function getAvailableUsdt() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    /**
     * @dev Get current vesting configuration
     */
    function getConfiguration() external view returns (
        uint256 price,
        uint256 minInvestment,
        uint256 cliffSeconds,
        uint256 unlockPercent,
        uint256 vestingSeconds,
        uint256 withdrawalPeriodSeconds
    ) {
        return (
            vestingPrice,
            minimumInvestmentAmount,
            cliffPeriodSeconds,
            unlockPercentPerPeriod,
            vestingEndSeconds,
            withdrawalPeriod
        );
    }

    // ==================== PRIVATE/INTERNAL FUNCTIONS ====================

    /**
     * @dev Get unlocked amount using current unlockPercentPerPeriod and withdrawalPeriod
     */
    function getUnlockedAmount(uint256 totalAmount, uint256 cliffEnd, uint256 vestingEnd) internal view returns (uint256) {
        return VestingMath.calculateCliffMonthlyRelease(
            totalAmount,
            cliffEnd,
            vestingEnd,
            unlockPercentPerPeriod,
            withdrawalPeriod
        );
    }

    // ==================== OWNER CONFIGURATION FUNCTIONS ====================

    /**
     * @dev Set treasury wallet (owner only)
     */
    function setTreasuryWallet(address _newTreasury) external onlyAdmin {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasuryWallet = _newTreasury;
        emit TreasuryWalletUpdated(_newTreasury);
    }

    /**
     * @dev Set liquidity pool contract for USDT routing (owner only)
     */
    function setLiquidityContract(address _liquidityAddress) external onlyAdmin {
        require(_liquidityAddress != address(0), "Invalid liquidity address");
        liquidity = ILiquidity(_liquidityAddress);
    }

    /**
     * @dev Withdraw collected USDT to treasury (owner only)
     */
    function withdrawUsdt(uint256 amount) external onlyAdmin nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient USDT");

        usdtToken.safeTransfer(treasuryWallet, amount);
        emit UsdtWithdrawn(treasuryWallet, amount);
    }

    /**
     * @dev Set all vesting configuration at once (owner only)
     * All parameters in one function for atomic updates
     *
     * @param newVestingPrice Price in wei (e.g., 0.2 * 1e18 for 0.2 USDT)
     * @param newMinInvestment Minimum investment in wei (e.g., 10 * 1e18 for 10 USDT)
     * @param newCliffMonths Cliff period in months (1-120)
     * @param newUnlockPercent Unlock percentage per period (e.g., 250 for 2.5%)
     * @param newVestingMonths Total vesting period in months
     * @param newWithdrawalPeriod Withdrawal period in seconds (e.g., 30 days)
     */
    function setVestingConfiguration(
        uint256 newVestingPrice,
        uint256 newMinInvestment,
        uint256 newCliffMonths,
        uint256 newUnlockPercent,
        uint256 newVestingMonths,
        uint256 newWithdrawalPeriod
    ) external onlyAdmin {
        // Validate all parameters
        require(newVestingPrice > 0, "Vesting price must be > 0");
        require(newMinInvestment > 0, "Minimum investment must be > 0");
        require(newCliffMonths > 0 && newCliffMonths <= 120, "Cliff period must be 1-120 months");
        require(newUnlockPercent > 0 && newUnlockPercent <= BPS, "Unlock percent must be 1-BPS (0.01%-100%)");
        require(newVestingMonths >= newCliffMonths, "Vesting months must be >= cliff months");
        require(newWithdrawalPeriod > 0 && newWithdrawalPeriod <= 365 days, "Withdrawal period must be 1 sec - 1 year");

        // Update all parameters atomically
        vestingPrice = newVestingPrice;
        minimumInvestmentAmount = newMinInvestment;
        cliffPeriodSeconds = newCliffMonths * 30 days; // Convert months to seconds for compatibility
        unlockPercentPerPeriod = newUnlockPercent;
        vestingEndSeconds = newVestingMonths * 30 days; // Convert months to seconds for compatibility
        withdrawalPeriod = newWithdrawalPeriod;

        emit VestingConfigurationUpdated(
            newVestingPrice,
            newMinInvestment,
            newCliffMonths,
            newUnlockPercent,
            newVestingMonths,
            newWithdrawalPeriod
        );
    }

    /**
     * @dev Set liquidity slippage tolerance (owner only)
     */
    function setSlippageTolerance(uint256 newSlippageBps) external onlyAdmin {
        require(newSlippageBps > 0 && newSlippageBps <= BPS, "Slippage must be 1-BPS (0.01%-100%)");
        slippageBps = newSlippageBps;
    }

    /**
     * @dev Set USDT split percentages in basis points (owner only)
     * Example: 8000 bps = 80%, 2000 bps = 20%
     */
    function setUsdtSplitBps(uint256 newLiquidityBps, uint256 newTreasuryBps) external onlyAdmin {
        require(newLiquidityBps + newTreasuryBps == BPS, "Basis points must sum to BPS (100%)");
        require(newLiquidityBps > 0 && newTreasuryBps > 0, "Both amounts must be > 0");
        usdtToLiquidityBps = newLiquidityBps;
        usdtToTreasuryBps = newTreasuryBps;
    }
}
