// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AdminOwnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IAEOS.sol";
import "./interfaces/IUSDT.sol";
import "./interfaces/ILiquidity.sol";
import "./interfaces/IAeosGenealogy.sol";
import "./libraries/VestingMath.sol";

/**
 * @title AeosVestingStrategic
 * @dev Strategic Investors vesting module (10%, 100M AEOS)
 * - Public purchase at 0.2 USDT per AEOS
 * - 6 months cliff
 * - 5% quarterly unlock (20 quarters = 5 years)
 * - Per-investment release (no looping, gas efficient)
 */
contract AeosVestingStrategic is AdminOwnable, ReentrancyGuard {
    using SafeERC20 for IAEOS;
    using SafeERC20 for IUSDT;

    // ==================== STATE VARIABLES ====================

    // Constants
    uint256 public constant ALLOCATION = 100_000_000 * 1e18; // 100M AEOS
    uint256 private constant BPS = 10000; // Basis points denominator (10000 bps = 100%)

    // Token Interfaces (set by constructor, not hardcoded)
    IAEOS public aeosToken;
    IUSDT public usdtToken;
    ILiquidity public liquidity;
    IAeosGenealogy public genealogy; // Genealogy contract for referral tracking

    // Struct for updateStrategicVesting to avoid EVM stack-too-deep
    struct InvestmentUpdate {
        uint256 amount;
        uint256 released;
        uint256 purchaseTime;
        uint256 releasedTime;
        uint256 cliffEnd;
        uint256 vestingEnd;
        bool    isCompleted;
    }

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

    // ==================== DEPOSIT/WITHDRAWAL MONITORING ====================
    uint256 public totalDeposited; // Total AEOS deposited to contract (owner deposits)
    uint256 public totalWithdrawn; // Total AEOS withdrawn by users (via releaseStrategicTokens)
    uint256 public totalWithdrawnByOwner; // Total AEOS withdrawn by owner (withdrawAEOS function)

    // ==================== FUNDING REQUIREMENT TRACKING ====================
    uint256 public totalAeosClaimable; // Current AEOS available to claim (decreases as users claim tokens)

    // Configuration (Owner-configurable with defaults)
    // ⚠️ TESTING VALUES BELOW - REVERT TO PRODUCTION BEFORE MAINNET
    uint256 public vestingPrice = 0.2 * 1e18; // 0.2 USDT per AEOS
    uint256 public minimumInvestmentAmount = 10 * 1e18; // Min 10 USDT

    // CLIFF PERIOD: Default 6 months (180 days), Testing 18 minutes
    // PRODUCTION: uint256 public cliffPeriodSeconds = 180 days;
    // TESTING:    uint256 public cliffPeriodSeconds = 18 minutes;
    uint256 public cliffPeriodSeconds = 18 minutes; // 1,080 seconds (testing) | 15,552,000 seconds (production: 180 days)

    uint256 public unlockPercentPerPeriod = 500; // 5% per period (500 bps)

    // VESTING END TIME: Default 60 months total, Testing 3 hours total
    // Note: vestingEnd is calculated as: block.timestamp + vestingEndSeconds
    // PRODUCTION: uint256 public vestingEndSeconds = 1800 days;
    // TESTING:    uint256 public vestingEndSeconds = 3 hours;
    uint256 public vestingEndSeconds = 3 hours; // 10,800 seconds (testing) | 155,520,000 seconds (production: 1800 days)

    // WITHDRAWAL PERIOD (unlock frequency): Default 90 days, Testing 9 minutes
    // PRODUCTION: uint256 public withdrawalPeriod = 90 days;
    // TESTING:    uint256 public withdrawalPeriod = 9 minutes;
    uint256 public withdrawalPeriod = 9 minutes; // 540 seconds (testing) | 7,776,000 seconds (production: 90 days)
    uint256 public slippageBps = 2500; // 25% slippage tolerance (2500 bps = 25%)
    uint256 public usdtToLiquidityBps = 8000; // 80% of USDT to liquidity (8000 bps = 80%)
    uint256 public usdtToTreasuryBps = 2000; // 20% of USDT to treasury (2000 bps = 20%)

    // Wallets
    address public treasuryWallet;

    // ==================== REFERRAL REWARDS ====================
    uint256 public constant REFERRAL_BONUS_BPS = 1000; // 10% referral bonus (1000 bps = 10%)
    mapping(address => uint256) public referralRewards; // Referral AEOS rewards per user
    uint256 public totalReferralRewarded; // Track total referral rewards distributed

    // ==================== TIERED PRICING (OWNER CONFIGURABLE) ====================
    // STRICT TYPE DISCIPLINE: All uint256 amounts are in wei (18 decimals)
    // NO conversions inside contract - frontend handles all conversions
    //
    // Tier 1: 10-100 USDT = 10e18 - 100e18 wei
    uint256 public tier1MaxUSDTWei = 100 * 1e18;    // 100 USDT in wei
    uint256 public tier1PriceWei = 0.30 * 1e18;     // 0.30 USDT per AEOS in wei

    // Tier 2: 101-500 USDT = 101e18 - 500e18 wei
    uint256 public tier2MaxUSDTWei = 500 * 1e18;    // 500 USDT in wei
    uint256 public tier2PriceWei = 0.28 * 1e18;     // 0.28 USDT per AEOS in wei

    // Tier 3: 501-2000 USDT = 501e18 - 2000e18 wei
    uint256 public tier3MaxUSDTWei = 2000 * 1e18;   // 2000 USDT in wei
    uint256 public tier3PriceWei = 0.24 * 1e18;     // 0.24 USDT per AEOS in wei

    // Tier 4: 2001+ USDT = 2001e18+ wei
    uint256 public tier4PriceWei = 0.20 * 1e18;     // 0.20 USDT per AEOS in wei

    // ==================== EVENTS ====================

    event StrategicVestingPurchased(address indexed buyer, uint256 usdtAmount, uint256 aeosAmount, uint256 cliffEnd);
    event StrategicTokensReleased(address indexed investor, uint256 investmentIndex, uint256 amount);
    event InvestmentCompleted(address indexed investor, uint256 investmentIndex);
    event TreasuryWalletUpdated(address indexed newWallet);
    event UsdtWithdrawn(address indexed to, uint256 amount);
    event LiquidityRoutingFailed(string reason);
    event DebugTransfer(bool success, address from, address to, uint256 amount);
    event AeosDeposited(uint256 amount, uint256 totalDepositedNow);
    event AeosWithdrawnByUser(uint256 amount, uint256 totalWithdrawnNow);
    event AeosWithdrawnByOwner(address indexed to, uint256 amount, uint256 totalWithdrawnNow);
    event FundingRequirementUpdated(uint256 totalRequired, uint256 totalDeposited, uint256 fundingGap);
    event VestingConfigurationUpdated(
        uint256 newVestingPrice,
        uint256 newMinInvestment,
        uint256 newCliffMonths,
        uint256 newUnlockPercent,
        uint256 newVestingMonths,
        uint256 newWithdrawalPeriod
    );
    event ReferralRewardCredited(address indexed sponsor, address indexed referrer, uint256 amount);
    event ReferralRewardsClaimed(address indexed user, uint256 amount);
    event ReferralRewardsUpdatedByOwner(address indexed user, uint256 newAmount);
    event StrategicVestingAdded(address indexed user, uint256 amount, uint256 purchaseTime, uint256 cliffEnd, uint256 vestingEnd);
    event StrategicVestingUpdated(address indexed user, uint256 index, uint256 amount, uint256 released, uint256 cliffEnd, uint256 vestingEnd, bool isCompleted);

    // ==================== CONSTRUCTOR ====================

    constructor(address _aeosToken, address _usdtToken, address _genealogy)  {
        require(_aeosToken != address(0), "Invalid AEOS token");
        require(_usdtToken != address(0), "Invalid USDT token");
        aeosToken = IAEOS(_aeosToken);
        usdtToken = IUSDT(_usdtToken);
        if (_genealogy != address(0)) {
            genealogy = IAeosGenealogy(_genealogy);
        }
        treasuryWallet = msg.sender; // Default to deployer, can be updated via setTreasuryWallet()
    }

    // ==================== PUBLIC/EXTERNAL FUNCTIONS ====================

    /**
     * @notice Dynamically calculate AEOS vesting price based on USDT purchase amount (tiered pricing).
     *         Returns different prices for different purchase tiers with built-in volume discounts.
     *
     * @dev STRICT TYPE DISCIPLINE: All parameters and returns are in wei (18 decimals).
     *      NO internal conversions. Frontend MUST multiply raw USDT amounts by 1e18 before calling.
     *      Contract receives wei, compares directly with tier boundaries, returns price in wei.
     *      This enforces type safety and prevents accidental conversions.
     *
     * @param usdtAmountWei Purchase amount in USDT wei (18 decimals)
     *                      Example: 100 USDT = 100000000000000000000 wei
     *                      Example: 500 USDT = 500000000000000000000 wei
     *                      Example: 2000 USDT = 2000000000000000000000 wei
     *
     * @return priceWei Price per AEOS in wei (18 decimals)
     *                  Tier 1: 300000000000000000 wei (0.30 USDT)
     *                  Tier 2: 280000000000000000 wei (0.28 USDT) - 6.7% discount
     *                  Tier 3: 240000000000000000 wei (0.24 USDT) - 20% discount
     *                  Tier 4: 200000000000000000 wei (0.20 USDT) - 33.3% discount
     *
     * @dev Tier Logic (all comparisons in wei, >= operator for inclusive lower bounds):
     *      - Tier 1: usdtAmountWei < 100e18 → returns tier1PriceWei (0.30 USDT per AEOS)
     *      - Tier 2: 100e18 <= usdtAmountWei < 500e18 → returns tier2PriceWei (0.28 USDT per AEOS)
     *      - Tier 3: 500e18 <= usdtAmountWei < 2000e18 → returns tier3PriceWei (0.24 USDT per AEOS)
     *      - Tier 4: usdtAmountWei >= 2000e18 → returns tier4PriceWei (0.20 USDT per AEOS)
     *
     * @dev Example Flow (100 USDT purchase):
     *      1. Frontend: input = 100 (raw USDT)
     *      2. Frontend: converts = 100 * 1e18 = 100000000000000000000 wei
     *      3. Frontend: calls getPriceForAmount(100000000000000000000)
     *      4. Contract: receives usdtAmountWei = 100000000000000000000
     *      5. Contract: compares: 100000000000000000000 >= tier1MaxUSDTWei (100e18) → TRUE
     *      6. Contract: checks: 100000000000000000000 >= tier2MaxUSDTWei (500e18) → FALSE
     *      7. Contract: returns tier2PriceWei = 280000000000000000
     *      8. Frontend: receives priceWei = 280000000000000000
     *      9. Frontend: converts = formatEther(280000000000000000) = "0.28"
     *      10. Frontend: displays = "$0.28 per AEOS" (Tier 2, 6.7% discount)
     *
     * @dev Owner-Configurable: All tier prices and boundaries can be updated via:
     *      - setTier1Pricing(maxUSDT, price)
     *      - setTier2Pricing(maxUSDT, price)
     *      - setTier3Pricing(maxUSDT, price)
     *      - setTier4Price(price)
     */
    function getPriceForAmount(uint256 usdtAmountWei) public view returns (uint256 priceWei) {
        // NO CONVERSIONS - Compare directly in wei. Frontend must pass wei format.
        if (usdtAmountWei >= tier3MaxUSDTWei) {
            return tier4PriceWei;      // Tier 4: 2000+ USDT
        } else if (usdtAmountWei >= tier2MaxUSDTWei) {
            return tier3PriceWei;      // Tier 3: 500-1999 USDT
        } else if (usdtAmountWei >= tier1MaxUSDTWei) {
            return tier2PriceWei;      // Tier 2: 100-499 USDT
        } else {
            return tier1PriceWei;      // Tier 1: 10-99 USDT
        }
    }

    /**
     * @dev Public purchase of strategic vesting
     * User pays in USDT; AEOS will be available when owner deposits liquidity
     */
    function buyStrategicVesting(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount >= minimumInvestmentAmount, "Below minimum investment");

        // Get tiered price based on USDT amount
        uint256 price = getPriceForAmount(usdtAmount);
        uint256 aeosAmount = (usdtAmount * 1e18) / price;

        require(totalSold + aeosAmount <= ALLOCATION, "Exceeds strategic allocation");

        // CRITICAL: Transfer USDT from user to contract using basic transferFrom
        uint256 contractBalanceBefore = IERC20(address(usdtToken)).balanceOf(address(this));
        bool success = IERC20(address(usdtToken)).transferFrom(msg.sender, address(this), usdtAmount);
        uint256 contractBalanceAfter = IERC20(address(usdtToken)).balanceOf(address(this));
        emit DebugTransfer(success, msg.sender, address(this), usdtAmount);
        require(success, "USDT transfer failed");
        require(contractBalanceAfter > contractBalanceBefore, "Contract balance did not increase");

        // Split USDT: configurable basis points (default 8000 bps = 80% to liquidity, 2000 bps = 20% to treasury)
        uint256 usdtForLiquidity = (usdtAmount * usdtToLiquidityBps) / BPS;
        uint256 usdtForTreasury = (usdtAmount * usdtToTreasuryBps) / BPS;

        uint256 cliffEnd = block.timestamp + cliffPeriodSeconds;
        // TESTING: Use vestingEndSeconds directly | PRODUCTION: Change to (totalVestingMonths * 30 days)
        uint256 vestingEnd = block.timestamp + vestingEndSeconds;

        // ==================== REFERRAL BONUS LOGIC ====================
        // Check if user is registered in genealogy and has a sponsor
        if (address(genealogy) != address(0)) {
            (address sponsor, ) = genealogy.getAffiliate(msg.sender);
            if (sponsor != address(0)) {
                // Calculate 10% referral bonus
                uint256 referralBonus = (aeosAmount * REFERRAL_BONUS_BPS) / BPS;
                if (referralBonus > 0) {
                    referralRewards[sponsor] += referralBonus;
                    totalReferralRewarded += referralBonus;
                    emit ReferralRewardCredited(sponsor, msg.sender, referralBonus);
                }
            }
        }

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
        totalAeosClaimable += aeosAmount; // Add to claimable pool (will decrease as users claim)

        // Emit funding requirement update
        uint256 fundingGap = totalAeosClaimable > totalDeposited ? totalAeosClaimable - totalDeposited : 0;
        emit FundingRequirementUpdated(totalSold, totalDeposited, fundingGap);

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

        emit StrategicVestingPurchased(msg.sender, usdtAmount, aeosAmount, cliffEnd);
    }

    /**
     * @dev Release tokens from a single investment (gas efficient)
     * User specifies which investment to claim from
     */
    function releaseStrategicTokens(uint256 investmentIndex) external nonReentrant returns (uint256) {
        require(investmentIndex < investments[msg.sender].length, "Investment index out of bounds");
        Investment storage inv = investments[msg.sender][investmentIndex];

        require(!inv.isCompleted, "Investment already completed");

        uint256 claimable = getClaimableAmount(msg.sender, investmentIndex);
        require(claimable > 0, "No unlocked tokens");

        inv.released += claimable;
        totalAllocated -= claimable; // Release from allocation upon claim
        totalWithdrawn += claimable; // Track user withdrawal
        totalAeosClaimable -= claimable; // Reduce claimable pool as tokens are released
        inv.releasedTime = block.timestamp;

        // Mark as completed if all tokens released or vesting expired
        if (inv.released >= inv.amount || block.timestamp >= inv.vestingEnd) {
            inv.isCompleted = true;
            emit InvestmentCompleted(msg.sender, investmentIndex);
        }

        aeosToken.safeTransfer(msg.sender, claimable);
        emit StrategicTokensReleased(msg.sender, investmentIndex, claimable);
        emit AeosWithdrawnByUser(claimable, totalWithdrawn);
        emit FundingRequirementUpdated(totalSold, totalDeposited, getRemainingFundingGap());

        return claimable;
    }

    /**
     * @dev Release from multiple investments in one call (batch release)
     * More efficient than calling releaseStrategicTokens multiple times
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
            totalWithdrawn += claimable; // Track user withdrawal
            totalAeosClaimable -= claimable; // Reduce claimable pool as tokens are released

            if (inv.released >= inv.amount || block.timestamp >= inv.vestingEnd) {
                inv.isCompleted = true;
                emit InvestmentCompleted(msg.sender, index);
            }

            totalToRelease += claimable;
        }

        require(totalToRelease > 0, "No unlocked tokens");

        aeosToken.safeTransfer(msg.sender, totalToRelease);
        emit StrategicTokensReleased(msg.sender, 0, totalToRelease); // Index 0 indicates batch
        emit AeosWithdrawnByUser(totalToRelease, totalWithdrawn);
        emit FundingRequirementUpdated(totalSold, totalDeposited, getRemainingFundingGap());

        return totalToRelease;
    }

    /**
     * @notice Claim accumulated referral rewards (non-vested, immediate payout)
     * @dev Can only be called if user has referral rewards accumulated
     */
    function claimReferralRewards() external nonReentrant {
        uint256 rewards = referralRewards[msg.sender];
        require(rewards > 0, "No referral rewards to claim");

        // Clear referral rewards
        referralRewards[msg.sender] = 0;

        // Transfer AEOS directly (not subject to vesting, immediate payout)
        aeosToken.safeTransfer(msg.sender, rewards);
        emit ReferralRewardsClaimed(msg.sender, rewards);
    }

    // ==================== VIEW FUNCTIONS (Getters) ====================

    /**
     * @dev Get claimable amount for a specific investment (no looping)
     */
    function getClaimableAmount(address investor, uint256 investmentIndex) public view returns (uint256) {
        require(investmentIndex < investments[investor].length, "Investment index out of bounds");
        Investment storage inv = investments[investor][investmentIndex];

        if (inv.isCompleted) return 0;

        uint256 unlocked = getUnlockedAmount(inv.amount, inv.cliffEnd, inv.vestingEnd);

        return unlocked > inv.released ? unlocked - inv.released : 0;
    }

    /**
     * @dev Get withdrawal period info for an investment
     * Shows: quarters elapsed, next eligible withdrawal date, quarters since last withdrawal
     */
    function getWithdrawalPeriodInfo(address investor, uint256 investmentIndex) external view returns (
        uint256 quartersSinceCliff,
        uint256 quartersSinceLastWithdrawal,
        uint256 nextEligibleWithdrawalTime,
        bool canWithdrawNow,
        uint256 quarterlyCyclesPending
    ) {
        require(investmentIndex < investments[investor].length, "Investment index out of bounds");
        Investment storage inv = investments[investor][investmentIndex];

        uint256 now_ = block.timestamp;

        // Before cliff: no quarters available
        if (now_ < inv.cliffEnd) {
            return (0, 0, inv.cliffEnd, false, 0);
        }

        // After cliff: calculate periods
        uint256 secondsSinceCliff = now_ - inv.cliffEnd;
        quartersSinceCliff = secondsSinceCliff / withdrawalPeriod;

        // Periods since last release
        uint256 secondsSinceLastRelease = now_ - inv.releasedTime;
        quartersSinceLastWithdrawal = secondsSinceLastRelease / withdrawalPeriod;

        // Next eligible withdrawal: lastReleaseTime + (periods pending × withdrawalPeriod)
        uint256 periodsPendingForNextEligible = (secondsSinceLastRelease / withdrawalPeriod); // Round down
        nextEligibleWithdrawalTime = inv.releasedTime + (periodsPendingForNextEligible * withdrawalPeriod) + withdrawalPeriod;

        // Can withdraw if at least 1 full period has passed since last withdrawal
        canWithdrawNow = quartersSinceLastWithdrawal > 0;

        // Periods that can be claimed in this withdrawal
        quarterlyCyclesPending = quartersSinceLastWithdrawal;

        return (quartersSinceCliff, quartersSinceLastWithdrawal, nextEligibleWithdrawalTime, canWithdrawNow, quarterlyCyclesPending);
    }

    /**
     * @dev Get expected withdrawal amount based on time gap
     * Example: if 186 days passed with 90-day periods, user can withdraw 5% × floor(186/90) = 10%
     */
    function getExpectedWithdrawalAmount(address investor, uint256 investmentIndex) external view returns (
        uint256 claimableAmount,
        uint256 periodsPending,
        uint256 percentageUnlocked
    ) {
        require(investmentIndex < investments[investor].length, "Investment index out of bounds");
        Investment storage inv = investments[investor][investmentIndex];

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
    function getTotalClaimable(address investor) external view returns (uint256) {
        Investment[] storage investorInvests = investments[investor];
        uint256 totalClaimable = 0;

        for (uint256 i = 0; i < investorInvests.length; i++) {
            if (!investorInvests[i].isCompleted) {
                totalClaimable += getClaimableAmount(investor, i);
            }
        }

        return totalClaimable;
    }

    /**
     * @dev Get referral rewards balance for a user
     */
    function getReferralRewardsBalance(address user) external view returns (uint256) {
        return referralRewards[user];
    }

    /**
     * @dev Get summary of all investments
     */
    function getInvestorSummary(address investor) external view returns (
        uint256 totalPurchased,
        uint256 totalReleased,
        uint256 totalClaimable,
        uint256 investmentCount,
        uint256 completedCount
    ) {
        Investment[] storage investorInvests = investments[investor];
        investmentCount = investorInvests.length;

        for (uint256 i = 0; i < investorInvests.length; i++) {
            Investment storage inv = investorInvests[i];
            totalPurchased += inv.amount;
            totalReleased += inv.released;

            if (!inv.isCompleted) {
                totalClaimable += getClaimableAmount(investor, i);
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
    function getInvestmentDetails(address investor, uint256 index) external view returns (
        uint256 amount,
        uint256 released,
        uint256 claimable,
        uint256 purchaseTime,
        uint256 releasedTime,
        uint256 cliffEnd,
        uint256 vestingEnd,
        bool isCompleted
    ) {
        require(index < investments[investor].length, "Investment index out of bounds");
        Investment storage inv = investments[investor][index];

        uint256 claimableAmount = getClaimableAmount(investor, index);

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
    function getInvestmentCount(address investor) external view returns (uint256) {
        return investments[investor].length;
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
     * @dev Get balance monitoring information
     * Returns: (contractBalance, totalAllocated, totalDeposited, totalWithdrawnByUsers, totalWithdrawnByOwner, isEnoughBalance)
     */
    function getBalanceStatus() external view returns (
        uint256 contractBalance,
        uint256 allocated,
        uint256 deposited,
        uint256 withdrawnByUsers,
        uint256 withdrawnByOwner,
        bool hasEnoughBalance
    ) {
        contractBalance = aeosToken.balanceOf(address(this));
        allocated = totalAllocated;
        deposited = totalDeposited;
        withdrawnByUsers = totalWithdrawn;
        withdrawnByOwner = totalWithdrawnByOwner;
        // Has enough balance if contract balance > total allocated tokens
        hasEnoughBalance = contractBalance > allocated;
        return (contractBalance, allocated, deposited, withdrawnByUsers, withdrawnByOwner, hasEnoughBalance);
    }

    /**
     * @dev Check if contract can withdraw a specific amount
     * Returns: (canWithdraw, availableAmount, reason)
     */
    function canWithdrawAmount(uint256 amount) external view returns (
        bool canWithdraw,
        uint256 availableAmount,
        string memory reason
    ) {
        uint256 contractBalance = aeosToken.balanceOf(address(this));

        // Check 1: Contract balance sufficient
        if (contractBalance < amount) {
            return (false, contractBalance, "Insufficient contract balance");
        }

        // Check 2: Available after allocated tokens
        uint256 available = contractBalance > totalAllocated ? contractBalance - totalAllocated : 0;
        if (available < amount) {
            return (false, available, "Amount exceeds available balance (allocated tokens reserved)");
        }

        return (true, available, "Sufficient balance available");
    }

    /**
     * @dev Get funding status and requirement tracking
     * Shows how much AEOS is needed vs deposited
     * totalAeosClaimable = Current amount still claimable (decreases as users claim)
     * Returns: (totalPromised, deposited, stillClaimable, fundingGap, isFunded, percentageFunded)
     */
    function getFundingStatus() external view returns (
        uint256 totalPromised,
        uint256 deposited,
        uint256 stillClaimable,
        uint256 fundingGap,
        bool isFunded,
        uint256 percentageFunded
    ) {
        totalPromised = totalSold;
        deposited = totalDeposited;
        stillClaimable = totalAeosClaimable; // Current amount remaining to be claimed

        // Funding gap = How much more needs to be deposited for outstanding claims
        fundingGap = stillClaimable > deposited ? stillClaimable - deposited : 0;

        // Contract is funded if: deposited >= stillClaimable
        isFunded = deposited >= stillClaimable;

        // Percentage funded of the REMAINING claimable amount
        percentageFunded = stillClaimable > 0 ? (deposited * 10000) / stillClaimable : 10000; // 10000 = 100%

        return (totalPromised, deposited, stillClaimable, fundingGap, isFunded, percentageFunded);
    }

    /**
     * @dev Get detailed funding breakdown
     * Shows total purchased, available to claim, claimed, and pending
     * Returns: (totalPurchased, availableBalance, allocatedBalance, surplusOrDeficit)
     */
    function getFundingBreakdown() external view returns (
        uint256 totalPurchased,
        uint256 availableBalance,
        uint256 allocatedBalance,
        uint256 surplusOrDeficit
    ) {
        totalPurchased = totalSold;
        uint256 contractBalance = aeosToken.balanceOf(address(this));
        availableBalance = contractBalance;
        allocatedBalance = totalAllocated;

        // Surplus = balance - purchased | Deficit = purchased - balance
        if (contractBalance >= totalPurchased) {
            surplusOrDeficit = contractBalance - totalPurchased; // Positive = surplus
        } else {
            surplusOrDeficit = 0; // 0 or would need to use negative representation
        }

        return (totalPurchased, availableBalance, allocatedBalance, surplusOrDeficit);
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
        return VestingMath.calculateCliffQuarterlyRelease(
            totalAmount,
            cliffEnd,
            vestingEnd,
            unlockPercentPerPeriod,
            withdrawalPeriod
        );
    }

    /**
     * @dev Calculate remaining funding gap
     * fundingGap = max(0, totalAeosClaimable - totalDeposited)
     * totalAeosClaimable already represents what's still claimable (decreases as users claim)
     */
    function getRemainingFundingGap() internal view returns (uint256) {
        return totalAeosClaimable > totalDeposited ? totalAeosClaimable - totalDeposited : 0;
    }

    /**
     * @dev Get withdrawal period info for an investment
     * Shows: quarters elapsed, next eligible withdrawal date, quarters since last withdrawal
     */

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
     * @dev Set genealogy contract for referral tracking (owner only)
     * Can be set to address(0) to disable referral tracking
     */
    function setAeosGenealogy(address _genealogyAddress) external onlyAdmin {
        genealogy = _genealogyAddress != address(0) ? IAeosGenealogy(_genealogyAddress) : IAeosGenealogy(address(0));
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
     * @param newUnlockPercent Unlock percentage per period (e.g., 500 for 5%)
     * @param newVestingMonths Total vesting period in months
     * @param newWithdrawalPeriod Withdrawal period in seconds (e.g., 90 days)
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

    // ==================== TIERED PRICING SETTERS ====================

    /**
     * @dev Set Tier 1 pricing (10-100 USDT)
     * STRICT TYPE: All parameters in wei (18 decimals)
     * @param newMaxUSDTWei Max USDT in wei. Example: 100 USDT = 100000000000000000000
     * @param newPriceWei Price per AEOS in wei. Example: 0.30 USDT = 300000000000000000
     */
    function setTier1Pricing(uint256 newMaxUSDTWei, uint256 newPriceWei) external onlyAdmin {
        require(newMaxUSDTWei > 0, "Max USDT must be > 0");
        require(newPriceWei > 0, "Price must be > 0");
        require(newMaxUSDTWei < tier2MaxUSDTWei, "Tier 1 max must be < Tier 2 max");
        tier1MaxUSDTWei = newMaxUSDTWei;
        tier1PriceWei = newPriceWei;
    }

    /**
     * @dev Set Tier 2 pricing (101-500 USDT)
     * STRICT TYPE: All parameters in wei (18 decimals)
     * @param newMaxUSDTWei Max USDT in wei. Example: 500 USDT = 500000000000000000000
     * @param newPriceWei Price per AEOS in wei. Example: 0.28 USDT = 280000000000000000
     */
    function setTier2Pricing(uint256 newMaxUSDTWei, uint256 newPriceWei) external onlyAdmin {
        require(newMaxUSDTWei > 0, "Max USDT must be > 0");
        require(newPriceWei > 0, "Price must be > 0");
        require(newMaxUSDTWei > tier1MaxUSDTWei, "Tier 2 max must be > Tier 1 max");
        require(newMaxUSDTWei < tier3MaxUSDTWei, "Tier 2 max must be < Tier 3 max");
        tier2MaxUSDTWei = newMaxUSDTWei;
        tier2PriceWei = newPriceWei;
    }

    /**
     * @dev Set Tier 3 pricing (501-2000 USDT)
     * STRICT TYPE: All parameters in wei (18 decimals)
     * @param newMaxUSDTWei Max USDT in wei. Example: 2000 USDT = 2000000000000000000000
     * @param newPriceWei Price per AEOS in wei. Example: 0.24 USDT = 240000000000000000
     */
    function setTier3Pricing(uint256 newMaxUSDTWei, uint256 newPriceWei) external onlyAdmin {
        require(newMaxUSDTWei > 0, "Max USDT must be > 0");
        require(newPriceWei > 0, "Price must be > 0");
        require(newMaxUSDTWei > tier2MaxUSDTWei, "Tier 3 max must be > Tier 2 max");
        tier3MaxUSDTWei = newMaxUSDTWei;
        tier3PriceWei = newPriceWei;
    }

    /**
     * @dev Set Tier 4 pricing (2001+ USDT)
     * STRICT TYPE: Price in wei (18 decimals)
     * @param newPriceWei Price per AEOS in wei. Example: 0.20 USDT = 200000000000000000
     */
    function setTier4Price(uint256 newPriceWei) external onlyAdmin {
        require(newPriceWei > 0, "Price must be > 0");
        tier4PriceWei = newPriceWei;
    }

    /**
     * @dev Deposit AEOS tokens to contract for claiming (owner only)
     * Must approve contract before calling
     */
    function depositStrategicTokens(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be > 0");
        bool success = IERC20(address(aeosToken)).transferFrom(msg.sender, address(this), amount);
        require(success, "AEOS transfer failed");
        totalDeposited += amount;
        emit AeosDeposited(amount, totalDeposited);
    }

    /**
     * @dev Withdraw AEOS tokens from contract (owner only)
     * Use this to transfer tokens to any address without adding to MetaMask
     * Checks if contract has enough balance after accounting for allocated tokens
     */
    function withdrawAEOS(address to, uint256 amount) external onlyAdmin nonReentrant {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be > 0");

        // Check if contract has enough balance to withdraw
        uint256 contractBalance = aeosToken.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient contract balance");

        // Ensure withdrawal doesn't compromise allocated tokens
        uint256 availableForWithdrawal = contractBalance - totalAllocated;
        require(availableForWithdrawal >= amount, "Insufficient available balance after accounting for allocated tokens");

        bool success = IERC20(address(aeosToken)).transfer(to, amount);
        require(success, "AEOS transfer failed");

        totalWithdrawnByOwner += amount;
        emit AeosWithdrawnByOwner(to, amount, totalWithdrawnByOwner);
    }

    /**
     * @dev Withdraw USDT tokens to arbitrary address (owner only)
     * Different from withdrawUsdt() which sends to treasuryWallet
     */
    function withdrawUSDTTo(address to, uint256 amount) external onlyAdmin nonReentrant {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be > 0");
        usdtToken.safeTransfer(to, amount);
    }

    // ==================== OWNER VESTING MANAGEMENT ====================

    /**
     * @notice Manually record a strategic vesting position for a user (owner only).
     * @dev    No USDT transfer, no liquidity routing, no referral bonus.
     *         Use for off-chain purchases, migrations, or manual allocations.
     *         cliffEnd and vestingEnd are computed from `timestamp` using the current
     *         cliffPeriodSeconds and vestingEndSeconds configuration at the time of the call.
     * @param user      The beneficiary wallet address
     * @param amount    AEOS amount in wei (18 decimals)
     * @param timestamp The purchase timestamp to anchor the cliff and vesting schedule
     */
    function addStrategicVesting(
        address user,
        uint256 amount,
        uint256 timestamp
    ) external onlyAdmin {
        require(user != address(0), "ZERO_ADDRESS");
        require(amount > 0, "ZERO_AMOUNT");
        require(timestamp > 0 && timestamp <= block.timestamp, "INVALID_TIMESTAMP");
        require(totalSold + amount <= ALLOCATION, "EXCEEDS_ALLOCATION");

        uint256 cliffEnd   = timestamp + cliffPeriodSeconds;
        uint256 vestingEnd = timestamp + vestingEndSeconds;

        investments[user].push(Investment({
            amount:       amount,
            released:     0,
            purchaseTime: timestamp,
            releasedTime: timestamp,
            cliffEnd:     cliffEnd,
            vestingEnd:   vestingEnd,
            isCompleted:  false
        }));

        totalSold          += amount;
        totalAllocated     += amount;
        totalAeosClaimable += amount;

        emit StrategicVestingAdded(user, amount, timestamp, cliffEnd, vestingEnd);
        emit FundingRequirementUpdated(totalSold, totalDeposited, getRemainingFundingGap());
    }

    /**
     * @notice Edit every field of an existing Investment record (owner only).
     * @dev    Recalculates totalSold, totalAllocated, and totalAeosClaimable to stay consistent.
     *         Use for corrections or migrations. Parameters are packed into InvestmentUpdate
     *         struct to avoid EVM stack-too-deep errors.
     * @param user  The investment owner
     * @param index Index into investments[user]
     * @param u     InvestmentUpdate struct containing all updated field values
     */
    function updateStrategicVesting(
        address user,
        uint256 index,
        InvestmentUpdate calldata u
    ) external onlyAdmin {
        require(user != address(0), "ZERO_ADDRESS");
        require(index < investments[user].length, "INDEX_OUT_OF_BOUNDS");
        require(u.released <= u.amount, "RELEASED_EXCEEDS_AMOUNT");
        require(u.cliffEnd <= u.vestingEnd, "CLIFF_AFTER_VESTING_END");

        Investment storage inv = investments[user][index];

        // ── Reconcile global tracking ─────────────────────────────────
        uint256 oldUnreleased = inv.amount > inv.released ? inv.amount - inv.released : 0;
        uint256 newUnreleased = u.amount   > u.released   ? u.amount   - u.released   : 0;

        if (u.amount > inv.amount) {
            uint256 delta = u.amount - inv.amount;
            require(totalSold + delta <= ALLOCATION, "EXCEEDS_ALLOCATION");
            totalSold += delta;
        } else if (u.amount < inv.amount) {
            totalSold -= inv.amount - u.amount;
        }

        if (newUnreleased > oldUnreleased) {
            uint256 delta = newUnreleased - oldUnreleased;
            totalAllocated     += delta;
            totalAeosClaimable += delta;
        } else if (newUnreleased < oldUnreleased) {
            uint256 delta = oldUnreleased - newUnreleased;
            totalAllocated     = totalAllocated     > delta ? totalAllocated     - delta : 0;
            totalAeosClaimable = totalAeosClaimable > delta ? totalAeosClaimable - delta : 0;
        }

        // ── Write updated fields ──────────────────────────────────────
        inv.amount       = u.amount;
        inv.released     = u.released;
        inv.purchaseTime = u.purchaseTime;
        inv.releasedTime = u.releasedTime;
        inv.cliffEnd     = u.cliffEnd;
        inv.vestingEnd   = u.vestingEnd;
        inv.isCompleted  = u.isCompleted;

        emit StrategicVestingUpdated(user, index, u.amount, u.released, u.cliffEnd, u.vestingEnd, u.isCompleted);
        emit FundingRequirementUpdated(totalSold, totalDeposited, getRemainingFundingGap());
    }

    // ==================== REFERRAL REWARDS — OWNER FUNCTIONS ====================

    /**
     * @notice Update referral rewards for a user (owner only, for migration/recovery)
     * @dev Sets the exact amount of referral rewards for a user
     * Use this to manually adjust rewards if genealogy was not properly tracked
     * @param user The user to update
     * @param newAmount The new referral reward amount
     */
    function updateReferralReward(address user, uint256 newAmount) external onlyAdmin {
        require(user != address(0), "Invalid user address");
        uint256 oldAmount = referralRewards[user];
        referralRewards[user] = newAmount;

        // Adjust total tracked rewards
        if (newAmount > oldAmount) {
            totalReferralRewarded += (newAmount - oldAmount);
        } else if (newAmount < oldAmount) {
            totalReferralRewarded -= (oldAmount - newAmount);
        }

        emit ReferralRewardsUpdatedByOwner(user, newAmount);
    }

    /**
     * @notice Add referral rewards for a user (owner only, for migration/recovery)
     * @dev Adds to existing referral rewards (doesn't replace)
     * Use this to manually add rewards if genealogy was not properly tracked
     * @param user The user to add rewards for
     * @param additionalAmount The amount to add
     */
    function addReferralReward(address user, uint256 additionalAmount) external onlyAdmin {
        require(user != address(0), "Invalid user address");
        require(additionalAmount > 0, "Amount must be > 0");

        referralRewards[user] += additionalAmount;
        totalReferralRewarded += additionalAmount;

        emit ReferralRewardsUpdatedByOwner(user, referralRewards[user]);
    }

    /**
     * @notice Withdraw referral rewards on behalf of user (owner only, for emergency)
     * @dev Allows owner to withdraw accumulated referral rewards and send to specified address
     * @param user The user whose rewards to withdraw
     * @param recipient The address to receive the rewards
     */
    function withdrawReferralRewardsFor(address user, address recipient) external onlyAdmin nonReentrant {
        require(user != address(0), "Invalid user address");
        require(recipient != address(0), "Invalid recipient address");

        uint256 rewards = referralRewards[user];
        require(rewards > 0, "No referral rewards to withdraw");

        referralRewards[user] = 0;
        aeosToken.safeTransfer(recipient, rewards);

        emit ReferralRewardsClaimed(user, rewards);
    }
}
