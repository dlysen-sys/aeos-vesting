// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// External packages
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  AdminOwnable
 * @notice Extends Ownable with a designated-admin layer.
 *         Owner can add/remove admins. Both owner and admins pass onlyAdmin.
 *         Only owner passes onlyOwner (manages the admin list itself).
 * @dev    Inherit this instead of Ownable in all AEOS vesting contracts.
 */
abstract contract AdminOwnable is Ownable {

    mapping(address => bool) public isAdmin;

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    modifier onlyAdmin() {
        require(msg.sender == owner() || isAdmin[msg.sender], "NOT_AUTHORIZED_ADMIN");
        _;
    }

    function addAdmin(address adminAddress) external onlyOwner {
        require(adminAddress != address(0), "ZERO_ADDRESS");
        require(!isAdmin[adminAddress], "ALREADY_ADMIN");
        isAdmin[adminAddress] = true;
        emit AdminAdded(adminAddress);
    }

    function removeAdmin(address adminAddress) external virtual onlyOwner {
        require(adminAddress != address(0), "ZERO_ADDRESS");
        require(isAdmin[adminAddress], "NOT_ADMIN");
        isAdmin[adminAddress] = false;
        emit AdminRemoved(adminAddress);
    }

    function checkIsAdmin(address addr) external view returns (bool) {
        return addr == owner() || isAdmin[addr];
    }
}
