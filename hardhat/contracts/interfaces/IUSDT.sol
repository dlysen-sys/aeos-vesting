// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUSDT is IERC20 {
    function decimals() external view returns (uint8);
}
