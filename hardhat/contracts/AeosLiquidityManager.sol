// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AdminOwnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {
    IERC721Receiver
} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./interfaces/IPancakeV3Pool.sol";
import "./interfaces/INonfungiblePositionManager.sol";
import "./interfaces/ISwapRouter.sol";
import "./libraries/TickMath.sol";
import "./libraries/FullMath.sol";

contract LIQUIDITY is AdminOwnable, ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    address private constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    address private constant AEOS = 0x89417b107aD0eF0Ce0dA82c5d6fD6c81F6e0d25A;
    INonfungiblePositionManager private constant POSITION_MANAGER =
        INonfungiblePositionManager(0x46A15B0b27311cedF172AB29E4f4766fbE7F4364);
    ISwapRouter private constant SWAP_ROUTER =
        ISwapRouter(0x1b81D678ffb9C0263b24A97847620C99d213eB14);
    IPancakeV3Pool private POOL;
    uint256 public TOKENID;
    address public TOKEN0;
    address public TOKEN1;
    uint24 public FEE;

    event PositionMinted(uint256 indexed tokenId);
    event LiquidityAdded(
        uint256 indexed tokenId,
        uint128 liquidity,
        uint256 amount0Used,
        uint256 amount1Used
    );
    event EmergencyWithdrawExecuted(
        address indexed user,
        uint256 currentLiquidity
    );
    event Swapped(
        address indexed user,
        address token0,
        address token1,
        uint256 usdtAmount,
        uint256 amountOutActual
    );
    event FeesCollected(
        uint256 amount0,
        uint256 amount1,
        address token0,
        address token1
    );
    event Deposited(address indexed token, address indexed sender, uint256 amount);

    constructor()  {}

    function addLiquidityUSDT(uint256 usdtAmount, uint24 slippageBps) public nonReentrant returns (uint256) {
        if (usdtAmount == 0) return 0;
        if (TOKENID == 0) return 0;
        if (slippageBps > 5000) return 0;

        // Pull USDT
        IERC20(USDT).transferFrom(msg.sender, address(this), usdtAmount);

        // Check Balance
        uint256 aeosBefore = IERC20(AEOS).balanceOf(address(this));
        uint256 usdtForLiq = usdtAmount;
        uint256 aeosForLiq = convertToken(USDT, usdtAmount);

        if (aeosForLiq > aeosBefore) {
            uint256 usdtToSwap = usdtAmount * 90 / 100;
            swapUSDTToAEOS(usdtToSwap, slippageBps);
            usdtForLiq = usdtAmount - usdtToSwap;
            // RECALCULATE aeosForLiq based on remaining USDT (key fix!)
            aeosForLiq = convertToken(USDT, usdtForLiq);
        }

        uint256 usdtAfter = IERC20(USDT).balanceOf(address(this));
        uint256 aeosAfter = IERC20(AEOS).balanceOf(address(this));

        // Safety check
        if (usdtForLiq > usdtAfter || aeosForLiq > aeosAfter) return 0;
        if (usdtForLiq == 0 || aeosForLiq == 0) return 0;
        // Assign amounts based on actual token0/token1 order
        uint256 amt0Desired = TOKEN0 == USDT ? usdtForLiq : aeosForLiq;
        uint256 amt1Desired = TOKEN1 == USDT ? usdtForLiq : aeosForLiq;
        uint256 amt0Min = _applySlippage(amt0Desired, slippageBps);
        uint256 amt1Min = _applySlippage(amt1Desired, slippageBps);
        // Add liquidity
        INonfungiblePositionManager.IncreaseLiquidityParams
            memory params = INonfungiblePositionManager
                .IncreaseLiquidityParams({
                    tokenId: TOKENID,
                    amount0Desired: amt0Desired,
                    amount1Desired: amt1Desired,
                    amount0Min: amt0Min,
                    amount1Min: amt1Min,
                    deadline: block.timestamp + 600
                });
        (
            uint128 liquidity,
            uint256 amount0Used,
            uint256 amount1Used
        ) = POSITION_MANAGER.increaseLiquidity(params);
        emit LiquidityAdded(TOKENID, liquidity, amount0Used, amount1Used);
        return liquidity;
    }

    function convertToken(
        address tokenIn,
        uint256 amountIn
    ) public view returns (uint256 expectedOut) {
        uint256 priceX96 = getTwapPriceX96(); // token1 per token0 in Q96
        if (priceX96 == 0) revert("InvalidPrice");
        bool usdtIsToken0 = (TOKEN0 == USDT);
        if (tokenIn == USDT) {
            if (usdtIsToken0) {
                // USDT (token0) → AEOS (token1): multiply by price
                expectedOut = FullMath.mulDiv(amountIn, priceX96, 1 << 96);
            } else {
                // USDT (token1) → AEOS (token0): divide by price
                expectedOut = FullMath.mulDiv(amountIn, 1 << 96, priceX96);
            }
        } else if (tokenIn == AEOS) {
            if (usdtIsToken0) {
                // AEOS (token1) → USDT (token0): divide by price
                expectedOut = FullMath.mulDiv(amountIn, 1 << 96, priceX96);
            } else {
                // AEOS (token0) → USDT (token1): multiply by price
                expectedOut = FullMath.mulDiv(amountIn, priceX96, 1 << 96);
            }
        } else {
            revert("InvalidToken");
        }
    }

    function getTwapPriceX96() public view returns (uint256 priceX96) {
        require(address(POOL) != address(0), "Pool not initialized");
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = 600;
        secondsAgos[1] = 0;
        uint256 twapPrice = 0;
        // Try TWAP first
        try POOL.observe(secondsAgos) returns (int56[] memory tickCumulatives, uint160[] memory /*unused*/) {
            int56 tickDelta = tickCumulatives[1] - tickCumulatives[0];
            int24 twapTick = int24(
                tickDelta < 0
                    ? (tickDelta - int56(uint56(600 - 1))) / int56(uint56(600))
                    : tickDelta / int56(uint56(600))
            );
            // Clamp to PancakeSwap min/max
            if (twapTick < TickMath.MIN_TICK) twapTick = TickMath.MIN_TICK;
            if (twapTick > TickMath.MAX_TICK) twapTick = TickMath.MAX_TICK;
            uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(twapTick);
            twapPrice = FullMath.mulDiv(
                uint256(sqrtPriceX96),
                uint256(sqrtPriceX96),
                1 << 96
            );
        } catch {
            // Ignore errors, fallback to spot
            twapPrice = 0;
        }
        // If TWAP calculation fails, revert instead of falling back to manipulable spot price
        // ⚠️ SECURITY: Spot price is trivially manipulable via flash loans. Only use TWAP.
        require(twapPrice != 0, "TwapPriceFailed: Oracle unavailable");
        priceX96 = twapPrice;
    }

    function swapUSDT(
        uint256 usdtAmount,
        uint24 maxSlippageBps
    ) external nonReentrant returns (uint256 amountOutActual) {
        if (usdtAmount == 0) revert("ZeroAmount");
        if (maxSlippageBps > 500) revert("SlippageTooHigh");
        IERC20(USDT).safeTransferFrom(
            msg.sender,
            address(this),
            usdtAmount
        );
        uint256 expectedOut = convertToken(USDT, usdtAmount);
        if (expectedOut == 0) revert("InvalidPoolOrZeroPrice");
        uint256 minOut = _applySlippage(expectedOut, maxSlippageBps);
        ISwapRouter.ExactInputSingleParams memory params;
        params.tokenIn = USDT;
        params.tokenOut = AEOS;
        params.fee = FEE;
        params.recipient = msg.sender;
        params.deadline = block.timestamp + 600;
        params.amountIn = usdtAmount;
        params.amountOutMinimum = minOut;
        params.sqrtPriceLimitX96 = 0;
        amountOutActual = SWAP_ROUTER.exactInputSingle(params);
        emit Swapped(msg.sender, USDT, AEOS, usdtAmount, amountOutActual);
        return amountOutActual;
    }

    function swapAEOS(
        uint256 aeosAmount,
        uint24 maxSlippageBps
    ) external nonReentrant returns (uint256 amountOutActual) {
        if (aeosAmount == 0) revert("ZeroAmount");
        if (maxSlippageBps > 500) revert("SlippageTooHigh");
        IERC20(AEOS).safeTransferFrom(
            msg.sender,
            address(this),
            aeosAmount
        );
        uint256 expectedOut = convertToken(AEOS, aeosAmount);
        if (expectedOut == 0) revert("InvalidPoolOrZeroPrice");
        uint256 minOut = _applySlippage(expectedOut, maxSlippageBps);
        ISwapRouter.ExactInputSingleParams memory params;
        params.tokenIn = AEOS;
        params.tokenOut = USDT;
        params.fee = FEE;
        params.recipient = msg.sender;
        params.deadline = block.timestamp + 600;
        params.amountIn = aeosAmount;
        params.amountOutMinimum = minOut;
        params.sqrtPriceLimitX96 = 0;
        amountOutActual = SWAP_ROUTER.exactInputSingle(params);
        emit Swapped(msg.sender, AEOS, USDT, aeosAmount, amountOutActual);
        return amountOutActual;
    }

    function swapUSDTToAEOS(
        uint256 usdtAmount,
        uint24 slippageBps
    ) internal returns (uint256 amountOutActual) {
        uint256 expectedOut = convertToken(USDT, usdtAmount);
        if (expectedOut == 0) {
            return 0;
        }
 
        uint256 minOut = _applySlippage(expectedOut, slippageBps);
        if (minOut == 0) minOut = 1;
        ISwapRouter.ExactInputSingleParams memory params;
        params.tokenIn = USDT;
        params.tokenOut = AEOS;
        params.fee = FEE;
        params.recipient = address(this);
        params.deadline = block.timestamp + 600;
        params.amountIn = usdtAmount;
        params.amountOutMinimum = minOut;
        params.sqrtPriceLimitX96 = 0;
        amountOutActual = SWAP_ROUTER.exactInputSingle(params);
        emit Swapped(address(this), USDT, AEOS, usdtAmount, amountOutActual);
        return amountOutActual;
    }

    function swapAEOSToUSDT(
        uint256 aeosAmount,
        uint24 slippageBps
    ) internal returns (uint256 amountOutActual) {
        uint256 expectedOut = convertToken(AEOS, aeosAmount);
          if (expectedOut == 0) {
            return 0;
        }        

        uint256 minOut = _applySlippage(expectedOut, slippageBps);
        ISwapRouter.ExactInputSingleParams memory params;
        params.tokenIn = AEOS;
        params.tokenOut = USDT;
        params.fee = FEE;
        params.recipient = address(this);
        params.deadline = block.timestamp + 600;
        params.amountIn = aeosAmount;
        params.amountOutMinimum = minOut;
        params.sqrtPriceLimitX96 = 0;
        amountOutActual = SWAP_ROUTER.exactInputSingle(params);
        emit Swapped(address(this), AEOS, USDT, aeosAmount, amountOutActual);
        return amountOutActual;
    }

    /* ===================== #1 INITIALIZE AEOS FUNDING ===================== */
    function depositAEOS(uint256 amount) external nonReentrant {
        require(amount > 0, "ZERO");
        IERC20(AEOS).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(AEOS, msg.sender, amount);
    }

    /* ===================== #2 INITIALIZE USDT FUNDING ===================== */
    function depositUSDT(uint256 amount) external nonReentrant {
        require(amount > 0, "ZERO");
        IERC20(USDT).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(USDT, msg.sender, amount);
    }

    /* ===================== #3a INITIALIZE APPROVAL ===================== */
    /// @dev Grant unlimited approval to position manager and swap router (production only)
    function initializeApproval() external onlyAdmin nonReentrant {
        IERC20(USDT).safeApprove(address(POSITION_MANAGER), type(uint256).max);
        IERC20(AEOS).safeApprove(address(POSITION_MANAGER), type(uint256).max);
        IERC20(USDT).safeApprove(address(SWAP_ROUTER), type(uint256).max);
        IERC20(AEOS).safeApprove(address(SWAP_ROUTER), type(uint256).max);
    }

    /* ===================== #3b REVOKE APPROVAL (EMERGENCY) ===================== */
    /**
     * @dev Emergency: Revoke all approvals if POSITION_MANAGER or SWAP_ROUTER is compromised
     * ⚠️ HIGH RISK: Unlimited approvals can drain all tokens if external contracts exploited
     * Only callable by owner in emergency situations
     */
    function revokeApproval() external onlyAdmin nonReentrant {
        IERC20(USDT).safeApprove(address(POSITION_MANAGER), 0);
        IERC20(AEOS).safeApprove(address(POSITION_MANAGER), 0);
        IERC20(USDT).safeApprove(address(SWAP_ROUTER), 0);
        IERC20(AEOS).safeApprove(address(SWAP_ROUTER), 0);
    }

    /* ===================== #4 INITIALIZE POOL ===================== */
    function initializePool(
        address _poolAddress
    ) external onlyAdmin nonReentrant {
        POOL = IPancakeV3Pool(_poolAddress);
        FEE = POOL.fee();
        TOKEN0 = POOL.token0();
        TOKEN1 = POOL.token1();
    }

    /* ===================== #5 INITIALIZE POSITION ===================== */
    function initializePosition() external onlyAdmin nonReentrant {
        require(address(POOL) != address(0), "Pool not initialized");
        require(TOKENID == 0, "Position already exists");
        uint256 aeosBal = IERC20(AEOS).balanceOf(address(this));
        uint256 usdtBal = IERC20(USDT).balanceOf(address(this));
        require(aeosBal > 0 && usdtBal > 0, "NO_FUNDS");
        int24 tickSpacing = POOL.tickSpacing();
        int24 lower = (TickMath.MIN_TICK / tickSpacing) * tickSpacing;
        int24 upper = (TickMath.MAX_TICK / tickSpacing) * tickSpacing;
        // Assign amounts based on actual token0/token1 order
        uint256 amt0 = TOKEN0 == USDT ? usdtBal : aeosBal;
        uint256 amt1 = TOKEN1 == USDT ? usdtBal : aeosBal;
        uint256 min0 = 0;
        uint256 min1 = 0;
        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: TOKEN0,
                token1: TOKEN1,
                fee: FEE,
                tickLower: lower,
                tickUpper: upper,
                amount0Desired: amt0,
                amount1Desired: amt1,
                amount0Min: min0,
                amount1Min: min1,
                recipient: address(this),
                deadline: block.timestamp + 300
            });
        (
            uint256 newTokenId,
            uint128 liquidity,
            uint256 amount0Used,
            uint256 amount1Used
        ) = POSITION_MANAGER.mint(params);
        TOKENID = newTokenId;
        emit PositionMinted(newTokenId);
        emit LiquidityAdded(newTokenId, liquidity, amount0Used, amount1Used);
    }

    /* ===================== #6 EMERGENCY ===================== */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        require(TOKENID != 0, "No position minted");
        (, , , , , , , uint128 currentLiquidity, , , , ) = POSITION_MANAGER
            .positions(TOKENID);
        require(currentLiquidity > 0, "Position has zero liquidity");

        POSITION_MANAGER.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: TOKENID,
                liquidity: currentLiquidity,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp + 300
            })
        );

        POSITION_MANAGER.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: TOKENID,
                recipient: msg.sender,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        // Burn NFT; dust in tokensOwed may cause revert, so wrap in try/catch
        try POSITION_MANAGER.burn(TOKENID) {} catch {}
        TOKENID = 0;

        uint256 aeosLeft = IERC20(AEOS).balanceOf(address(this));
        uint256 usdtLeft = IERC20(USDT).balanceOf(address(this));

        if (aeosLeft > 0) {
            IERC20(AEOS).safeTransfer(msg.sender, aeosLeft);
        }
        if (usdtLeft > 0) {
            IERC20(USDT).safeTransfer(msg.sender, usdtLeft);
        }

        emit EmergencyWithdrawExecuted(msg.sender, currentLiquidity);
    }

    function tokenWithdraw() external onlyOwner nonReentrant {
        uint256 aeosLeft = IERC20(AEOS).balanceOf(address(this));
        uint256 usdtLeft = IERC20(USDT).balanceOf(address(this));
        if (aeosLeft > 0) IERC20(AEOS).safeTransfer(owner(), aeosLeft);
        if (usdtLeft > 0) IERC20(USDT).safeTransfer(owner(), usdtLeft);
    }

    /* ===================== COLLECT FEES ===================== */
    function collectFees()
        external
        onlyAdmin
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        require(TOKENID != 0, "No position");
        require(
            TOKEN0 != address(0) && TOKEN1 != address(0),
            "Tokens not initialized"
        );
        uint256 usdtBefore = IERC20(USDT).balanceOf(address(this));
        uint256 aeosBefore = IERC20(AEOS).balanceOf(address(this));
        // Collect accumulated fees to this contract
        INonfungiblePositionManager.CollectParams
            memory params = INonfungiblePositionManager.CollectParams({
                tokenId: TOKENID,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });
        (amount0, amount1) = POSITION_MANAGER.collect(params);
        uint256 usdtAfter = IERC20(USDT).balanceOf(address(this));
        uint256 aeosAfter = IERC20(AEOS).balanceOf(address(this));
        uint256 collectAEOS = 0;
        if (aeosAfter > aeosBefore) {
            collectAEOS = aeosAfter - aeosBefore;
        }
        uint256 collectUSDT = 0;
        if (usdtAfter > usdtBefore) {
            collectUSDT = usdtAfter - usdtBefore;
        }
        // Transfer collected fees to owner
        if (collectUSDT > 0) {
            IERC20(USDT).safeTransfer(owner(), collectUSDT);
        }
        if (collectAEOS > 0) {
            IERC20(AEOS).safeTransfer(owner(), collectAEOS);
        }
        emit FeesCollected(amount0, amount1, TOKEN0, TOKEN1);
        return (amount0, amount1);
    }

    /* ===================== ERC721 RECEIVER ===================== */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /* ===================== SLIPPAGE HELPER ===================== */
    function _applySlippage(
        uint256 amount,
        uint24 slippageBps
    ) private pure returns (uint256) {
        if (amount == 0) return 0;
        uint256 min = (amount * (10000 - slippageBps)) / 10000;
        return min == 0 ? 1 : min;
    }
}
