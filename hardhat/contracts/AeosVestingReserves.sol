// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// External packages
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Local base
import "./AdminOwnable.sol";

// Interfaces
import "./interfaces/IAEOS.sol";

/**
 * @title AeosVestingReserves
 * @dev Reserves tracking module (Treasury, Liquidity, Community, Ecosystem, Growth)
 * - Treasury Reserve: 25% (250M) — Locked, tracked
 * - Liquidity & Market Making: 10% (100M) — 30% instant, 70% locked (5% quarterly)
 * - Community Incentives: 20% (200M) — Tracked balance
 * - Ecosystem Development: 15% (150M) — 10% instant, 10% yearly
 * - Community Growth: 5% (50M) — 5% instant, 5% quarterly
 */
contract AeosVestingReserves is AdminOwnable {
    using SafeERC20 for IAEOS;

    address private constant AEOS_ADDRESS = 0x89417b107aD0eF0Ce0dA82c5d6fD6c81F6e0d25A;

    IAEOS public aeosToken = IAEOS(AEOS_ADDRESS);

    // Reserve allocations
    uint256 public constant TREASURY_ALLOCATION = 250_000_000 * 1e18; // 25%
    uint256 public constant LIQUIDITY_ALLOCATION = 100_000_000 * 1e18; // 10%
    uint256 public constant COMMUNITY_INCENTIVES_ALLOCATION = 200_000_000 * 1e18; // 20%
    uint256 public constant ECOSYSTEM_ALLOCATION = 150_000_000 * 1e18; // 15%
    uint256 public constant COMMUNITY_GROWTH_ALLOCATION = 50_000_000 * 1e18; // 5%

    // Wallet addresses for each reserve
    address public treasuryWallet;
    address public liquidityWallet;
    address public communityIncentivesWallet;
    address public ecosystemWallet;
    address public communityGrowthWallet;

    // Liquidity tracking
    struct LiquidityRelease {
        uint256 released; // Cumulative amount released
        uint256 lastReleaseTime;
    }

    LiquidityRelease public liquidityRelease;
    uint256 public constant LIQUIDITY_INITIAL_PERCENT = 3000; // 30%
    uint256 public constant LIQUIDITY_QUARTERLY_PERCENT = 500; // 5% per quarter

    // Ecosystem tracking
    struct EcosystemRelease {
        uint256 released;
        uint256 lastReleaseTime;
    }

    EcosystemRelease public ecosystemRelease;
    uint256 public constant ECOSYSTEM_INITIAL_PERCENT = 1000; // 10%
    uint256 public constant ECOSYSTEM_YEARLY_PERCENT = 1000; // 10% per year

    // Community Growth tracking
    struct CommunityGrowthRelease {
        uint256 released;
        uint256 lastReleaseTime;
    }

    CommunityGrowthRelease public communityGrowthRelease;
    uint256 public constant COMMUNITY_GROWTH_INITIAL_PERCENT = 500; // 5%
    uint256 public constant COMMUNITY_GROWTH_QUARTERLY_PERCENT = 500; // 5% per quarter

    uint256 public vestingStartTime;

    // ==================== DEPOSIT TRACKING ====================
    // Track cumulative deposits per reserve to prevent overcounting
    uint256 public treasuryDeposited;
    uint256 public liquidityDeposited;
    uint256 public communityIncentivesDeposited;
    uint256 public ecosystemDeposited;
    uint256 public communityGrowthDeposited;

    event TreasuryWalletUpdated(address indexed newWallet);
    event LiquidityWalletUpdated(address indexed newWallet);
    event CommunityIncentivesWalletUpdated(address indexed newWallet);
    event EcosystemWalletUpdated(address indexed newWallet);
    event CommunityGrowthWalletUpdated(address indexed newWallet);

    event TreasuryDeposited(uint256 amount);
    event LiquidityDeposited(uint256 amount);
    event CommunityIncentivesDeposited(uint256 amount);
    event EcosystemDeposited(uint256 amount);
    event CommunityGrowthDeposited(uint256 amount);

    event LiquidityReleased(uint256 amount);
    event EcosystemReleased(uint256 amount);
    event CommunityGrowthReleased(uint256 amount);

    constructor(
        address _liquidity,
        address _communityIncentives,
        address _ecosystem,
        address _communityGrowth
    )  {
        require(_liquidity != address(0), "Invalid liquidity");
        require(_communityIncentives != address(0), "Invalid community incentives");
        require(_ecosystem != address(0), "Invalid ecosystem");
        require(_communityGrowth != address(0), "Invalid community growth");

        treasuryWallet = msg.sender; // Default to deployer, can be updated via setTreasuryWallet()
        liquidityWallet = _liquidity;
        communityIncentivesWallet = _communityIncentives;
        ecosystemWallet = _ecosystem;
        communityGrowthWallet = _communityGrowth;

        vestingStartTime = block.timestamp;
    }

    // ==================== Treasury ====================

    function depositTreasuryTokens(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be > 0");
        require(treasuryDeposited + amount <= TREASURY_ALLOCATION, "Exceeds treasury allocation");

        treasuryDeposited += amount;
        aeosToken.safeTransferFrom(msg.sender, treasuryWallet, amount);
        emit TreasuryDeposited(amount);
    }

    function getTreasuryBalance() external view returns (uint256) {
        return aeosToken.balanceOf(treasuryWallet);
    }

    // ==================== Liquidity ====================

    function depositLiquidityTokens(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be > 0");
        require(liquidityDeposited + amount <= LIQUIDITY_ALLOCATION, "Exceeds liquidity allocation");

        liquidityDeposited += amount;
        aeosToken.safeTransferFrom(msg.sender, address(this), amount);
        emit LiquidityDeposited(amount);
    }

    function releaseLiquidityTokens() external onlyAdmin {
        uint256 initialAmount = (LIQUIDITY_ALLOCATION * LIQUIDITY_INITIAL_PERCENT) / 10000;

        if (liquidityRelease.released == 0 && aeosToken.balanceOf(address(this)) >= initialAmount) {
            // Release initial 30%
            liquidityRelease.released = initialAmount;
            liquidityRelease.lastReleaseTime = block.timestamp;
            aeosToken.safeTransfer(liquidityWallet, initialAmount);
            emit LiquidityReleased(initialAmount);
        } else if (liquidityRelease.released > 0) {
            // Release quarterly 5%
            uint256 quartersSinceStart = (block.timestamp - liquidityRelease.lastReleaseTime) / (90 days);
            if (quartersSinceStart > 0) {
                uint256 remaining = LIQUIDITY_ALLOCATION - liquidityRelease.released;
                uint256 quarterlyAmount = (LIQUIDITY_ALLOCATION * LIQUIDITY_QUARTERLY_PERCENT) / 10000;
                uint256 toRelease = quarterlyAmount * quartersSinceStart;

                if (toRelease > remaining) {
                    toRelease = remaining;
                }

                liquidityRelease.released += toRelease;
                // Advance lastReleaseTime by the periods released, preserving fractional remainder
                liquidityRelease.lastReleaseTime += quartersSinceStart * 90 days;
                aeosToken.safeTransfer(liquidityWallet, toRelease);
                emit LiquidityReleased(toRelease);
            }
        }
    }

    function getLiquidityBalance() external view returns (uint256) {
        return aeosToken.balanceOf(liquidityWallet);
    }

    // ==================== Community Incentives ====================

    function depositCommunityIncentivesTokens(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be > 0");
        require(communityIncentivesDeposited + amount <= COMMUNITY_INCENTIVES_ALLOCATION, "Exceeds community incentives allocation");

        communityIncentivesDeposited += amount;
        aeosToken.safeTransferFrom(msg.sender, communityIncentivesWallet, amount);
        emit CommunityIncentivesDeposited(amount);
    }

    function getCommunityIncentivesBalance() external view returns (uint256) {
        return aeosToken.balanceOf(communityIncentivesWallet);
    }

    // ==================== Ecosystem Development ====================

    function depositEcosystemTokens(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be > 0");
        require(ecosystemDeposited + amount <= ECOSYSTEM_ALLOCATION, "Exceeds ecosystem allocation");

        ecosystemDeposited += amount;
        aeosToken.safeTransferFrom(msg.sender, address(this), amount);
        emit EcosystemDeposited(amount);
    }

    function releaseEcosystemTokens() external onlyAdmin {
        uint256 initialAmount = (ECOSYSTEM_ALLOCATION * ECOSYSTEM_INITIAL_PERCENT) / 10000;

        if (ecosystemRelease.released == 0 && aeosToken.balanceOf(address(this)) >= initialAmount) {
            // Release initial 10% (15M)
            ecosystemRelease.released = initialAmount;
            ecosystemRelease.lastReleaseTime = block.timestamp;
            aeosToken.safeTransfer(ecosystemWallet, initialAmount);
            emit EcosystemReleased(initialAmount);
        } else if (ecosystemRelease.released > 0) {
            // Release yearly 10%
            uint256 yearsSinceStart = (block.timestamp - ecosystemRelease.lastReleaseTime) / (365 days);
            if (yearsSinceStart > 0) {
                uint256 remaining = ECOSYSTEM_ALLOCATION - ecosystemRelease.released;
                uint256 yearlyAmount = (ECOSYSTEM_ALLOCATION * ECOSYSTEM_YEARLY_PERCENT) / 10000;
                uint256 toRelease = yearlyAmount * yearsSinceStart;

                if (toRelease > remaining) {
                    toRelease = remaining;
                }

                ecosystemRelease.released += toRelease;
                // Advance lastReleaseTime by the periods released, preserving fractional remainder
                ecosystemRelease.lastReleaseTime += yearsSinceStart * 365 days;
                aeosToken.safeTransfer(ecosystemWallet, toRelease);
                emit EcosystemReleased(toRelease);
            }
        }
    }

    function getEcosystemBalance() external view returns (uint256) {
        return aeosToken.balanceOf(ecosystemWallet);
    }

    // ==================== Community Growth ====================

    function depositCommunityGrowthTokens(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be > 0");
        require(communityGrowthDeposited + amount <= COMMUNITY_GROWTH_ALLOCATION, "Exceeds community growth allocation");

        communityGrowthDeposited += amount;
        aeosToken.safeTransferFrom(msg.sender, address(this), amount);
        emit CommunityGrowthDeposited(amount);
    }

    function releaseCommunityGrowthTokens() external onlyAdmin {
        uint256 initialAmount = (COMMUNITY_GROWTH_ALLOCATION * COMMUNITY_GROWTH_INITIAL_PERCENT) / 10000;

        if (communityGrowthRelease.released == 0 && aeosToken.balanceOf(address(this)) >= initialAmount) {
            // Release initial 5% (2.5M)
            communityGrowthRelease.released = initialAmount;
            communityGrowthRelease.lastReleaseTime = block.timestamp;
            aeosToken.safeTransfer(communityGrowthWallet, initialAmount);
            emit CommunityGrowthReleased(initialAmount);
        } else if (communityGrowthRelease.released > 0) {
            // Release quarterly 5%
            uint256 quartersSinceStart = (block.timestamp - communityGrowthRelease.lastReleaseTime) / (90 days);
            if (quartersSinceStart > 0) {
                uint256 remaining = COMMUNITY_GROWTH_ALLOCATION - communityGrowthRelease.released;
                uint256 quarterlyAmount = (COMMUNITY_GROWTH_ALLOCATION * COMMUNITY_GROWTH_QUARTERLY_PERCENT) / 10000;
                uint256 toRelease = quarterlyAmount * quartersSinceStart;

                if (toRelease > remaining) {
                    toRelease = remaining;
                }

                communityGrowthRelease.released += toRelease;
                // Advance lastReleaseTime by the periods released, preserving fractional remainder
                communityGrowthRelease.lastReleaseTime += quartersSinceStart * 90 days;
                aeosToken.safeTransfer(communityGrowthWallet, toRelease);
                emit CommunityGrowthReleased(toRelease);
            }
        }
    }

    function getCommunityGrowthBalance() external view returns (uint256) {
        return aeosToken.balanceOf(communityGrowthWallet);
    }

    // ==================== Wallet Management ====================

    function setTreasuryWallet(address _newWallet) external onlyAdmin {
        require(_newWallet != address(0), "Invalid address");
        treasuryWallet = _newWallet;
        emit TreasuryWalletUpdated(_newWallet);
    }

    function setLiquidityWallet(address _newWallet) external onlyAdmin {
        require(_newWallet != address(0), "Invalid address");
        liquidityWallet = _newWallet;
        emit LiquidityWalletUpdated(_newWallet);
    }

    function setCommunityIncentivesWallet(address _newWallet) external onlyAdmin {
        require(_newWallet != address(0), "Invalid address");
        communityIncentivesWallet = _newWallet;
        emit CommunityIncentivesWalletUpdated(_newWallet);
    }

    function setEcosystemWallet(address _newWallet) external onlyAdmin {
        require(_newWallet != address(0), "Invalid address");
        ecosystemWallet = _newWallet;
        emit EcosystemWalletUpdated(_newWallet);
    }

    function setCommunityGrowthWallet(address _newWallet) external onlyAdmin {
        require(_newWallet != address(0), "Invalid address");
        communityGrowthWallet = _newWallet;
        emit CommunityGrowthWalletUpdated(_newWallet);
    }
}
