// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20Mock
 * @dev Mock ERC20 token for testing ONLY — onlyOwner mint/burn controls
 * ⚠️ MUST NOT be deployed to mainnet. Only for local/testnet testing.
 */
contract ERC20Mock is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue
    ) ERC20(name, symbol) Ownable() {
        _decimals = decimalsValue;
        _mint(msg.sender, 2_000_000 * 1e18);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        _burn(from, amount);
    }
}
