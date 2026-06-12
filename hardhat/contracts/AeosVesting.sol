// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAEOS.sol";
import "./AeosVestingTeam.sol";
import "./AeosVestingStrategic.sol";
import "./AeosVestingAdvisors.sol";
import "./AeosVestingReserves.sol";

/**
 * @title AeosVesting
 * @dev Main orchestrator for AEOS vesting system
 * Manages all 8 allocation modules:
 * 1. Team & Founders (10%) — AeosVestingTeam
 * 2. Strategic Investors (10%) — AeosVestingStrategic
 * 3. Advisors & Partnerships (5%) — AeosVestingAdvisors
 * 4. Treasury, Liquidity, Community Tracking — AeosVestingReserves
 * 5. Community Incentives (20%)
 * 6. Ecosystem Development (15%)
 * 7. Community Growth (5%)
 * 8. (Tracked via Reserves module)
 *
 * Total: 1,000,000,000 AEOS
 */
contract AeosVesting is Ownable {
    // Module contracts
    AeosVestingTeam public teamModule;
    AeosVestingStrategic public strategicModule;
    AeosVestingAdvisors public advisorsModule;
    AeosVestingReserves public reservesModule;

    // Token references
    address public aeosToken;
    address public usdtToken;

    // Deployment events
    event ModulesDeployed(
        address indexed teamModule,
        address indexed strategicModule,
        address indexed advisorsModule,
        address reservesModule
    );

    constructor(address _aeosToken, address _usdtToken) {
        require(_aeosToken != address(0), "Invalid AEOS token");
        require(_usdtToken != address(0), "Invalid USDT token");
        aeosToken = _aeosToken;
        usdtToken = _usdtToken;
    }

    /**
     * @dev Initialize all vesting modules (owner only, called once)
     */
    function initializeModules(
        address _liquidity,
        address _communityIncentives,
        address _ecosystem,
        address _communityGrowth
    ) external onlyOwner {
        require(address(teamModule) == address(0), "Modules already initialized");

        // Deploy Team module
        teamModule = new AeosVestingTeam(aeosToken);

        // Deploy Strategic Investors module
        strategicModule = new AeosVestingStrategic(aeosToken, usdtToken);

        // Deploy Advisors module
        advisorsModule = new AeosVestingAdvisors(aeosToken, usdtToken);

        // Deploy Reserves module (treasuryWallet defaults to msg.sender)
        reservesModule = new AeosVestingReserves(
            _liquidity,
            _communityIncentives,
            _ecosystem,
            _communityGrowth
        );

        emit ModulesDeployed(
            address(teamModule),
            address(strategicModule),
            address(advisorsModule),
            address(reservesModule)
        );
    }

    /**
     * @dev Get all module addresses
     */
    function getModules() external view returns (
        address team,
        address strategic,
        address advisors,
        address reserves
    ) {
        return (
            address(teamModule),
            address(strategicModule),
            address(advisorsModule),
            address(reservesModule)
        );
    }

    /**
     * @dev Get total vesting info for a user across all modules
     * Note: Individual modules provide specific getter functions
     */
    function getUserVestingInfo(address user) external view returns (
        uint256 teamTotal,
        uint256 teamUnlocked,
        uint256 strategicTotal,
        uint256 strategicUnlocked,
        uint256 advisorTotal,
        uint256 advisorUnlocked
    ) {
        // Query modules individually for their specific getter functions
        // Each module (Team, Strategic, Advisors) has its own data retrieval interface
        // This aggregator remains for future integration
        return (0, 0, 0, 0, 0, 0);
    }

    /**
     * @dev Emergency withdraw AEOS tokens (owner only)
     * Used only if tokens are stuck (should not happen in normal operation)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).transfer(msg.sender, amount);
    }
}
