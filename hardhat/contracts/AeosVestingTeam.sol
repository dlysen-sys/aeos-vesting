// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IAEOS.sol";
import "./libraries/VestingMath.sol";

/**
 * @title AeosVestingTeam
 * @dev Team & Founders vesting module (10%, 100M AEOS)
 * - 18 months cliff
 * - 2% monthly unlock (50 months total)
 * - Owner-only assignment and deposits
 */
contract AeosVestingTeam is Ownable, ReentrancyGuard {
    using SafeERC20 for IAEOS;

    IAEOS public aeosToken;

    uint256 public constant ALLOCATION = 100_000_000 * 1e18; // 100M AEOS
    // ⚠️ TESTING VALUES BELOW - REVERT TO PRODUCTION BEFORE MAINNET

    // CLIFF PERIOD: Default 18 months (540 days), Testing 54 minutes
    // PRODUCTION: uint256 public constant CLIFF_SECONDS = 540 days;
    // TESTING:    uint256 public constant CLIFF_SECONDS = 54 minutes;
    uint256 public constant CLIFF_SECONDS = 54 minutes; // 3,240 seconds (testing) | 46,656,000 seconds (production: 540 days)

    uint256 public constant UNLOCK_PERCENT_MONTHLY = 200; // 2%

    // VESTING END TIME: Default 60 months total, Testing 5 hours total
    // Note: vestingEnd is calculated as: block.timestamp + (VESTING_MONTHS * 30 days) in production
    //       OR: block.timestamp + VESTING_END_SECONDS in testing
    // PRODUCTION: uint256 public constant VESTING_MONTHS = 60;
    // TESTING:    uint256 public constant VESTING_END_SECONDS = 5 hours;
    uint256 public constant VESTING_MONTHS = 0; // Not used in testing (use VESTING_END_SECONDS)
    uint256 public constant VESTING_END_SECONDS = 5 hours; // 18,000 seconds (testing) | 155,520,000 seconds (production: 1800 days)

    struct TeamMember {
        uint256 totalAllocated;
        uint256 released;
        uint256 cliffEnd;
        uint256 vestingEnd;
    }

    mapping(address => TeamMember) public members;
    uint256 public totalDeposited;

    event TeamMemberAssigned(address indexed member, uint256 amount, uint256 cliffEnd, uint256 vestingEnd);
    event TeamTokensDeposited(uint256 amount);
    event TeamTokensReleased(address indexed member, uint256 amount);

    constructor(address _aeosToken)  {
        require(_aeosToken != address(0), "Invalid AEOS token");
        aeosToken = IAEOS(_aeosToken);
    }

    /**
     * @dev Assign vesting to team member (owner only)
     */
    function assignTeamMember(address member, uint256 amount) external onlyOwner {
        require(member != address(0), "Invalid member address");
        require(amount > 0, "Amount must be > 0");
        require(totalDeposited >= amount, "Insufficient tokens deposited");

        TeamMember storage tm = members[member];
        require(tm.totalAllocated == 0, "Member already assigned");

        uint256 cliffEnd = block.timestamp + CLIFF_SECONDS;
        // TESTING: Use VESTING_END_SECONDS directly | PRODUCTION: Change to (VESTING_MONTHS * 30 days)
        uint256 vestingEnd = block.timestamp + VESTING_END_SECONDS;

        tm.totalAllocated = amount;
        tm.cliffEnd = cliffEnd;
        tm.vestingEnd = vestingEnd;

        emit TeamMemberAssigned(member, amount, cliffEnd, vestingEnd);
    }

    /**
     * @dev Deposit AEOS tokens for team vesting (owner only)
     */
    function depositTeamTokens(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(totalDeposited + amount <= ALLOCATION, "Exceeds team allocation");

        aeosToken.safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;

        emit TeamTokensDeposited(amount);
    }

    /**
     * @dev Calculate unlocked amount for a team member
     */
    function getUnlockableAmount(address member) public view returns (uint256) {
        TeamMember storage tm = members[member];
        if (tm.totalAllocated == 0) return 0;

        uint256 unlocked = VestingMath.calculateCliffMonthlyRelease(
            tm.totalAllocated,
            tm.cliffEnd,
            tm.vestingEnd,
            UNLOCK_PERCENT_MONTHLY
        );

        return unlocked > tm.released ? unlocked - tm.released : 0;
    }

    /**
     * @dev Release unlocked tokens to team member
     */
    function releaseTeamTokens(address member) external nonReentrant returns (uint256) {
        require(member != address(0), "Invalid member address");

        uint256 unlockable = getUnlockableAmount(member);
        require(unlockable > 0, "No unlocked tokens");

        members[member].released += unlockable;

        aeosToken.safeTransfer(member, unlockable);

        emit TeamTokensReleased(member, unlockable);
        return unlockable;
    }

    /**
     * @dev Get team member vesting info
     */
    function getMemberInfo(address member) external view returns (
        uint256 totalAllocated,
        uint256 released,
        uint256 unlocked,
        uint256 cliffEnd,
        uint256 vestingEnd
    ) {
        TeamMember storage tm = members[member];
        unlocked = VestingMath.calculateCliffMonthlyRelease(
            tm.totalAllocated,
            tm.cliffEnd,
            tm.vestingEnd,
            UNLOCK_PERCENT_MONTHLY
        );

        return (tm.totalAllocated, tm.released, unlocked, tm.cliffEnd, tm.vestingEnd);
    }

    /**
     * @dev Get available balance (owner can withdraw unclaimed tokens after vesting ends)
     */
    function getAvailableBalance() external view returns (uint256) {
        return aeosToken.balanceOf(address(this));
    }
}
