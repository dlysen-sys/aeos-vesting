// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVestingModule {
    function beneficiary(address user) external view returns (address);
    function totalAllocated(address user) external view returns (uint256);
    function releasedAmount(address user) external view returns (uint256);
    function unlockedAmount(address user) external view returns (uint256);
    function cliffEnd(address user) external view returns (uint256);
    function vestingEnd(address user) external view returns (uint256);
    function getUnlockableAmount(address user) external view returns (uint256);
    function release(address user) external returns (uint256);
}
