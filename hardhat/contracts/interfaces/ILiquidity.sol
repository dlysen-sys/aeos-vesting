// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ILiquidity
/// @notice Interface for the AEOS liquidity pool management contract
interface ILiquidity {
    /// @notice Add USDT to the liquidity pool
    /// @param usdtAmount Amount of USDT to contribute
    /// @param slippageBps Slippage tolerance in basis points (e.g., 500 = 0.5%)
    /// @return Amount of liquidity added
    function addLiquidityUSDT(uint256 usdtAmount, uint24 slippageBps)
        external
        returns (uint256);

    /// @notice Get the liquidity position token ID
    /// @return Current liquidity position ID (0 if not initialized)
    function TOKENID() external view returns (uint256);

    /// @notice Get the 10-minute TWAP price (Q64.96 fixed-point)
    /// Falls back to spot price if TWAP unavailable or pool too shallow
    /// @return priceX96 token1 per token0 as a Q96 value (price × 2^96)
    function getTwapPriceX96() external view returns (uint256);

    /// @notice Swap USDT to AEOS via PancakeSwap V3
    /// @param usdtAmount Amount of USDT to swap
    /// @param maxSlippageBps Maximum slippage tolerance in basis points
    /// @return amountOut Amount of AEOS received
    function swapUSDT(uint256 usdtAmount, uint24 maxSlippageBps)
        external
        returns (uint256 amountOut);

    /// @notice Swap AEOS to USDT via PancakeSwap V3
    /// @param aeosAmount Amount of AEOS to swap
    /// @param maxSlippageBps Maximum slippage tolerance in basis points
    /// @return amountOut Amount of USDT received
    function swapAEOS(uint256 aeosAmount, uint24 maxSlippageBps)
        external
        returns (uint256 amountOut);
}
