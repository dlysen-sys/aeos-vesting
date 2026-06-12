# SafeERC20 Implementation Examples — AEOS Vesting

Complete before-and-after code examples for fixing the `safeApprove()` revert.

---

## Example 1: Current Broken Code (Line 248–275)

**File:** `AeosVestingStrategic.sol`

```solidity
// Try to route 80% to liquidity pool; if fails, send 100% to treasury
bool liquidityRoutingSuccessful = false;
if (
    address(liquidity) != address(0) &&
    liquidity.TOKENID() != 0 &&
    usdtForLiquidity > 0
) {
    // ❌ THIS REVERTS ON SECOND CALL
    usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
    
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
```

**Execution trace:**

```
User 1 buys 100 USDT:
├─ allowance(contract, liquidity) = 0
├─ safeApprove(liquidity, 500) ✅
│  └─ Check: value == 0? NO, allowance == 0? YES → PASS
│  └─ allowance now = 500
├─ addLiquidityUSDT(500) partially consumes
│  └─ allowance remaining = 200 (not fully consumed)
└─ safeTransfer(treasury, 20) ✅

User 2 buys 50 USDT:
├─ allowance(contract, liquidity) = 200 (residual from User 1)
├─ safeApprove(liquidity, 250) ❌ REVERT
│  └─ Check: value == 0? NO, allowance == 0? NO → FAIL
│  └─ Error: "SafeERC20: approve from non-zero to non-zero allowance"
└─ Transaction reverts, User 2's purchase fails
```

---

## Example 2: Fix #1 — forceApprove() (Recommended)

**File:** `AeosVestingStrategic.sol`, lines 248–275

**Changed lines:** 255

```solidity
// Try to route 80% to liquidity pool; if fails, send 100% to treasury
bool liquidityRoutingSuccessful = false;
if (
    address(liquidity) != address(0) &&
    liquidity.TOKENID() != 0 &&
    usdtForLiquidity > 0
) {
    // ✅ FIXED: Use forceApprove() instead (requires OZ v4.9.3+)
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
```

**How forceApprove() works internally (simplified):**

```solidity
function forceApprove(IERC20 token, address spender, uint256 value) internal {
    bytes memory approvalCall = abi.encodeWithSelector(
        token.approve.selector, spender, value
    );
    
    // Try to approve directly
    if (!_callOptionalReturnBool(token, approvalCall)) {
        // If it fails, reset to 0 first, then retry
        _callOptionalReturn(token, abi.encodeWithSelector(
            token.approve.selector, spender, 0
        ));
        _callOptionalReturn(token, approvalCall);
    }
}
```

**Execution trace with fix:**

```
User 1 buys 100 USDT:
├─ allowance = 0
├─ forceApprove(500) ✅
│  └─ approve(500) succeeds directly
│  └─ allowance now = 500
└─ allowance remaining = 200

User 2 buys 50 USDT:
├─ allowance = 200
├─ forceApprove(250) ✅
│  └─ approve(250) attempt with allowance 200 might fail
│  └─ Internal retry: approve(0) → approve(250)
│  └─ allowance now = 250
└─ Success! ✅
```

---

## Example 3: Fix #2 — Manual Reset + safeApprove()

**File:** `AeosVestingStrategic.sol`, lines 248–275

**Changed lines:** 255–256

```solidity
// Try to route 80% to liquidity pool; if fails, send 100% to treasury
bool liquidityRoutingSuccessful = false;
if (
    address(liquidity) != address(0) &&
    liquidity.TOKENID() != 0 &&
    usdtForLiquidity > 0
) {
    // ✅ FIXED: Reset to 0 first, then set new amount (works with any OZ version)
    usdtToken.safeApprove(address(liquidity), 0);
    usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
    
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
```

**Why this works:**

```
First call: safeApprove(liquidity, 0)
├─ Check: value == 0? YES → PASS ✅
├─ approve(0) executes
└─ allowance = 0

Second call: safeApprove(liquidity, amount)
├─ Check: value == 0? NO, allowance == 0? YES → PASS ✅
├─ approve(amount) executes
└─ allowance = amount

Result: Both calls succeed for any number of iterations!
```

---

## Example 4: Fix #3 — safeIncreaseAllowance()

**File:** `AeosVestingStrategic.sol`, lines 248–275

**Changed lines:** 255–259

```solidity
// Try to route 80% to liquidity pool; if fails, send 100% to treasury
bool liquidityRoutingSuccessful = false;
if (
    address(liquidity) != address(0) &&
    liquidity.TOKENID() != 0 &&
    usdtForLiquidity > 0
) {
    // ✅ FIXED: Clear existing allowance, then increase by new amount
    uint256 currentAllowance = usdtToken.allowance(address(this), address(liquidity));
    if (currentAllowance > 0) {
        usdtToken.safeDecreaseAllowance(address(liquidity), currentAllowance);
    }
    usdtToken.safeIncreaseAllowance(address(liquidity), usdtForLiquidity);
    
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
```

**Most explicit version — good for code clarity:**

```
User 2 buys:
├─ currentAllowance = 200
├─ safeDecreaseAllowance(200)
│  └─ allowance = 200 - 200 = 0
├─ safeIncreaseAllowance(250)
│  └─ allowance = 0 + 250 = 250
└─ Success! ✅
```

---

## Example 5: Fixing AeosLiquidityManager.initializeApproval()

**File:** `AeosLiquidityManager.sol`, lines 310–315

### Current (Raw approve)

```solidity
function initializeApproval() external onlyOwner nonReentrant {
    // ⚠️ Uses raw approve() which could be problematic if called twice
    IERC20(USDT).approve(address(POSITION_MANAGER), type(uint256).max);
    IERC20(AEOS).approve(address(POSITION_MANAGER), type(uint256).max);
    IERC20(USDT).approve(address(SWAP_ROUTER), type(uint256).max);
    IERC20(AEOS).approve(address(SWAP_ROUTER), type(uint256).max);
}
```

### Fixed (forceApprove)

```solidity
function initializeApproval() external onlyOwner nonReentrant {
    // ✅ Uses forceApprove() which handles any prior allowance
    IERC20(USDT).forceApprove(address(POSITION_MANAGER), type(uint256).max);
    IERC20(AEOS).forceApprove(address(POSITION_MANAGER), type(uint256).max);
    IERC20(USDT).forceApprove(address(SWAP_ROUTER), type(uint256).max);
    IERC20(AEOS).forceApprove(address(SWAP_ROUTER), type(uint256).max);
}
```

**Why this matters:**

```
Scenario: initializeApproval() accidentally called twice

First call (with approve):
├─ approve(POSITION_MANAGER, type(uint256).max)
└─ allowance = max

Second call (with approve):
├─ approve(POSITION_MANAGER, type(uint256).max)
│  └─ Works fine, just overwrites to max again
└─ allowance = max

Second call (with forceApprove):
├─ forceApprove() → approve(max) fails if allowance > 0
├─ Internal: approve(0) → approve(max)
├─ allowance = 0 → max
└─ Works fine, more robust
```

---

## Example 6: Complete Patched Files

### AeosVestingStrategic.sol (with Fix #1)

**Only changed line 255:**

```diff
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
  import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
  // ... rest of imports
  
  contract AeosVestingStrategic is Ownable, ReentrancyGuard {
    // ... rest of contract
    
    function buyStrategicVesting(uint256 usdtAmount) external nonReentrant {
        // ... code before liquidity routing
        
        bool liquidityRoutingSuccessful = false;
        if (
            address(liquidity) != address(0) &&
            liquidity.TOKENID() != 0 &&
            usdtForLiquidity > 0
        ) {
-           usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
+           usdtToken.forceApprove(address(liquidity), usdtForLiquidity);
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
        
        // ... rest of function
    }
  }
```

### AeosLiquidityManager.sol (with Fix)

**Changed lines 311–314:**

```diff
  function initializeApproval() external onlyOwner nonReentrant {
-     IERC20(USDT).approve(address(POSITION_MANAGER), type(uint256).max);
-     IERC20(AEOS).approve(address(POSITION_MANAGER), type(uint256).max);
-     IERC20(USDT).approve(address(SWAP_ROUTER), type(uint256).max);
-     IERC20(AEOS).approve(address(SWAP_ROUTER), type(uint256).max);
+     IERC20(USDT).forceApprove(address(POSITION_MANAGER), type(uint256).max);
+     IERC20(AEOS).forceApprove(address(POSITION_MANAGER), type(uint256).max);
+     IERC20(USDT).forceApprove(address(SWAP_ROUTER), type(uint256).max);
+     IERC20(AEOS).forceApprove(address(SWAP_ROUTER), type(uint256).max);
  }
```

---

## Testing the Fixes

### Test Case 1: Sequential Purchases (Unit Test)

```solidity
// In test file (e.g., AeosVestingStrategic.test.js or .sol)

function testMultipleStrategicPurchases() public {
    uint256 usdtAmount = 100e18; // 100 USDT
    
    // User 1
    vm.startPrank(user1);
    usdt.approve(address(vesting), usdtAmount);
    vesting.buyStrategicVesting(usdtAmount);
    vm.stopPrank();
    console.log("✅ User 1 purchase succeeded");
    
    // User 2 (THIS REVERTS WITHOUT THE FIX)
    vm.startPrank(user2);
    usdt.approve(address(vesting), usdtAmount);
    vesting.buyStrategicVesting(usdtAmount);  // Should not revert with fix
    vm.stopPrank();
    console.log("✅ User 2 purchase succeeded");
    
    // Verify both purchases recorded
    (uint256 user1Count) = vesting.getInvestmentCount(user1);
    (uint256 user2Count) = vesting.getInvestmentCount(user2);
    
    assert(user1Count == 1);
    assert(user2Count == 1);
    console.log("✅ Both purchases recorded correctly");
}
```

### Test Case 2: Rapid Successive Purchases

```solidity
function testRapidSuccessivePurchases() public {
    uint256 usdtAmount = 50e18;
    
    for (uint256 i = 0; i < 5; i++) {
        address user = address(uint160(0x1000 + i));
        vm.startPrank(user);
        usdt.approve(address(vesting), usdtAmount);
        
        // Should succeed for all iterations, not just first
        vesting.buyStrategicVesting(usdtAmount);
        
        vm.stopPrank();
        console.log("✅ User", i, "purchase succeeded");
    }
}
```

### Test Case 3: Allowance Tracking

```solidity
function testAllowanceAfterFix() public {
    uint256 usdtAmount = 100e18;
    
    // Purchase 1
    vm.startPrank(user1);
    usdt.approve(address(vesting), usdtAmount);
    vesting.buyStrategicVesting(usdtAmount);
    vm.stopPrank();
    
    // Check allowance (may be residual)
    uint256 allowanceAfterFirst = usdt.allowance(address(vesting), address(liquidity));
    console.log("Allowance after first purchase:", allowanceAfterFirst);
    
    // Purchase 2 should still work despite residual allowance
    vm.startPrank(user2);
    usdt.approve(address(vesting), usdtAmount);
    vesting.buyStrategicVesting(usdtAmount);
    vm.stopPrank();
    
    uint256 allowanceAfterSecond = usdt.allowance(address(vesting), address(liquidity));
    console.log("Allowance after second purchase:", allowanceAfterSecond);
    console.log("✅ Both purchases succeeded despite allowance residual");
}
```

---

## Deployment Steps

```bash
# 1. Apply the fix to source files
#    Edit AeosVestingStrategic.sol line 255
#    Edit AeosLiquidityManager.sol lines 311-314

# 2. Verify OpenZeppelin version (if using forceApprove)
npm list @openzeppelin/contracts

# 3. Upgrade if needed
npm install @openzeppelin/contracts@latest

# 4. Recompile
npm run compile

# 5. Run tests
npm run test

# 6. Deploy to testnet
npm run deploy -- --network bscTestnet

# 7. Verify on testnet
npm run verify -- <contract_address> --network bscTestnet

# 8. Test manually on testnet UI
# → First user buys ✅
# → Second user buys ✅

# 9. Deploy to mainnet
npm run deploy:bsc

# 10. Verify on mainnet
npm run verify -- <contract_address> --network bsc
```

---

## Summary

| Fix | Lines Changed | Compatibility | Clarity | Recommendation |
|-----|---|---|---|---|
| **forceApprove()** | 1 | OZ v4.9.3+ | Highest | ✅ Best |
| **Manual reset** | 2 | All versions | High | Fallback |
| **safeIncreaseAllowance()** | 4 | All versions | Highest | Alternative |

**Choose forceApprove() unless your OpenZeppelin version is locked to < 4.9.3.**
