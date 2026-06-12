# SafeERC20.safeApprove() Revert Analysis — AEOS Vesting

## Executive Summary

The `safeApprove()` reverts on the **second call with a non-zero amount** due to a **race condition guard** built into OpenZeppelin's SafeERC20 library. This is intentional, not a bug. The contract code at line 255 in `AeosVestingStrategic.sol` triggers this guard.

---

## 1. Root Cause: The Race Condition Guard

### The Problem SafeERC20 Prevents

The ERC-20 `approve()` function has a well-known race condition:

```
User has allowance = 100
Tx1: User calls approve(spender, 50)    [wants to reduce from 100 to 50]
Tx2: User calls approve(spender, 200)   [wants to increase to 200]

RACE: If Tx2 is mined BEFORE Tx1's reduction is final:
  → Spender can front-run and spend the full 100
  → Then both approvals execute, giving spender access to 50 + 200 = 250
```

### SafeERC20's Defense

OpenZeppelin's `safeApprove()` (lines 45–54) enforces this invariant:

```solidity
function safeApprove(IERC20 token, address spender, uint256 value) internal {
    require(
        (value == 0) || (token.allowance(address(this), spender) == 0),
        "SafeERC20: approve from non-zero to non-zero allowance"
    );
    _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
}
```

**Translation:**
- ✅ ALLOWED: Approve **to zero** (clear existing allowance)
- ✅ ALLOWED: Approve **to non-zero when current is zero** (first approval)
- ❌ BLOCKED: Approve **to non-zero when current is already non-zero** (second approval)

**The error message:**
```
"SafeERC20: approve from non-zero to non-zero allowance"
```

---

## 2. Why Second Call Fails, First Succeeds

### First Call (Works)

```solidity
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
```

- **Before:** `allowance(contract, liquidity) = 0` (fresh)
- **Check:** `value == 0` → FALSE, but `allowance == 0` → TRUE
- **Result:** Approval succeeds ✅

### Second Call (Reverts)

Another user buys, triggers the same line again:

```solidity
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
```

- **Before:** `allowance(contract, liquidity) = 500` (leftover from Tx1)
- **Check:** `value == 0` → FALSE, and `allowance == 0` → FALSE
- **Result:** **REVERT** ❌

The second call fails because:
1. First call set allowance to some amount (e.g., 500)
2. If `liquidity.addLiquidityUSDT()` doesn't consume all 500, residual allowance remains
3. Second call tries to approve a new non-zero amount to a non-zero allowance → guard triggers

---

## 3. The Three Approval Patterns Explained

### Pattern 1: `approve()` (Raw ERC-20)
```solidity
token.approve(spender, amount);
```
- No safety check
- **Can be front-run** (race condition vulnerability)
- Works on first, second, third calls (overwrites regardless)
- **Risk:** Spender can exploit the gap between two approval calls

### Pattern 2: `safeApprove()` (SafeERC20 — Deprecated)
```solidity
token.safeApprove(spender, amount);
```
- **Enforces:** Must go from 0 → X or X → 0, never X → Y (X ≠ 0, Y ≠ 0)
- **Prevents race condition** but breaks multi-step workflows
- Works first time, **fails second time with non-zero values**
- **DEPRECATED** by OpenZeppelin — rarely used anymore

**Current AEOS code uses this (the problematic pattern):**
```solidity
// Line 255: AeosVestingStrategic.sol
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
```

### Pattern 3: `safeIncreaseAllowance()` / `safeDecreaseAllowance()` (Recommended)
```solidity
// Increase existing allowance
token.safeIncreaseAllowance(spender, amount);

// Decrease existing allowance
token.safeDecreaseAllowance(spender, amount);
```
- **No race condition** — only modifies existing allowance by delta
- Works unlimited times (first, second, tenth call)
- **This is the modern best practice**

### Pattern 4: `forceApprove()` (SafeERC20 v4.9.3+)
```solidity
token.forceApprove(spender, amount);
```
- Explicitly **resets to zero first**, then approves
- Bypasses the race condition guard entirely
- Works unlimited times
- **Best for USDT** (which requires zero before reapproving)
- Available in OpenZeppelin `@openzeppelin/contracts@^4.9.3`

---

## 4. Why safeTransfer Might Also Revert (Related vs. Separate Issue)

### Likely Related (Same Root Cause)

If `safeTransfer()` is reverting after `safeApprove()`, it's usually because:

1. **First `safeApprove()` succeeds** → sets allowance to `usdtForLiquidity`
2. **`liquidity.addLiquidityUSDT()` fails or partially consumes** → allowance not cleared
3. **Next `safeTransfer()` call in line 272** tries to send to treasury:
   ```solidity
   usdtToken.safeTransfer(treasuryWallet, treasuryAmount);
   ```
4. **If the contract's USDT balance is actually spent**, but prior state is corrupted → possible revert

### Potentially Separate (Insufficient Balance)

If the **only** issue is `safeTransfer()`, it could also mean:

```solidity
// Line 272
usdtToken.safeTransfer(treasuryWallet, treasuryAmount);
```

- **Requires:** Contract owns at least `treasuryAmount` of USDT
- **Reverts if:** Contract USDT balance < `treasuryAmount`
- **Check via view function (line 655):**
  ```solidity
  function getAvailableUsdt() external view returns (uint256) {
      return usdtToken.balanceOf(address(this));
  }
  ```

---

## 5. The AeosLiquidityManager.initializeApproval() Risk

Lines 310–315 in `AeosLiquidityManager.sol`:

```solidity
function initializeApproval() external onlyOwner nonReentrant {
    IERC20(USDT).approve(address(POSITION_MANAGER), type(uint256).max);
    IERC20(AEOS).approve(address(POSITION_MANAGER), type(uint256).max);
    IERC20(USDT).approve(address(SWAP_ROUTER), type(uint256).max);
    IERC20(AEOS).approve(address(SWAP_ROUTER), type(uint256).max);
}
```

### Issues

1. **Uses raw `approve()`, not `safeApprove()`**
   - No return value check
   - Could silently fail if token revert isn't caught

2. **Sets unlimited allowance (`type(uint256).max`)**
   - OK for trusted contracts like POSITION_MANAGER & SWAP_ROUTER
   - But any bug in those contracts exposes all tokens

3. **One-time initialization**
   - Should only run once (call it once on deployment)
   - If called twice, second call just overwrites (works fine)
   - But uses raw `approve()` which could be exploited if ordering matters

### Recommendation

Use `forceApprove()` instead:

```solidity
function initializeApproval() external onlyOwner nonReentrant {
    IERC20(USDT).forceApprove(address(POSITION_MANAGER), type(uint256).max);
    IERC20(AEOS).forceApprove(address(POSITION_MANAGER), type(uint256).max);
    IERC20(USDT).forceApprove(address(SWAP_ROUTER), type(uint256).max);
    IERC20(AEOS).forceApprove(address(SWAP_ROUTER), type(uint256).max);
}
```

This handles edge cases where allowance isn't zero (e.g., if called twice).

---

## 6. The Proper Pattern for Dynamic Amounts

### ❌ What the Code Does Now

```solidity
// Every user purchase calls this (BAD for repeated calls)
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
try liquidity.addLiquidityUSDT(usdtForLiquidity, uint24(slippageBps)) returns (uint256 lpAdded) {
    // ... use lpAdded
} catch {
    // ...
}
```

**Problem:** Second user's transaction reverts on line 255.

### ✅ Fix #1: Use forceApprove()

```solidity
// In AeosVestingStrategic.sol, line 255
usdtToken.forceApprove(address(liquidity), usdtForLiquidity);
try liquidity.addLiquidityUSDT(usdtForLiquidity, uint24(slippageBps)) returns (uint256 lpAdded) {
    // ...
} catch {
    // ...
}
```

**Works because:** `forceApprove()` always clears → sets, handling any prior allowance.

### ✅ Fix #2: Use safeIncreaseAllowance()

```solidity
// First, reset to zero
uint256 currentAllowance = usdtToken.allowance(address(this), address(liquidity));
if (currentAllowance > 0) {
    usdtToken.safeDecreaseAllowance(address(liquidity), currentAllowance);
}

// Then increase by the new amount
usdtToken.safeIncreaseAllowance(address(liquidity), usdtForLiquidity);
```

**More verbose but explicit:** Clear old allowance, increase by new delta.

### ✅ Fix #3: Manual Reset + safeApprove()

```solidity
// Reset to zero first
usdtToken.safeApprove(address(liquidity), 0);
// Then set to new amount
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
```

**Simple and clear:** Two calls, explicit reset between them. Works because:
1. First `safeApprove(0)` → allowance 100 → 0 ✅ (value == 0)
2. Second `safeApprove(amount)` → allowance 0 → amount ✅ (allowance == 0)

---

## 7. OpenZeppelin Version & Available Functions

### Current Version (from package.json or node_modules)

```
@openzeppelin/contracts: (check package.json or npm list)
```

### Function Availability by Version

| Function | v4.0+ | v4.9.3+ | Notes |
|----------|-------|---------|-------|
| `approve()` | ✅ | ✅ | Raw ERC-20, no safety |
| `safeApprove()` | ✅ | ✅ | Deprecated, race guard |
| `safeIncreaseAllowance()` | ✅ | ✅ | Safe, modern |
| `safeDecreaseAllowance()` | ✅ | ✅ | Safe, modern |
| `forceApprove()` | ❌ | ✅ | **Requires v4.9.3+** |

**Check your version:**
```bash
npm list @openzeppelin/contracts
```

If `< 4.9.3`, use Fix #3 (manual reset + safeApprove).  
If `>= 4.9.3`, use Fix #1 (forceApprove).

---

## 8. Summary Table

| Aspect | Details |
|--------|---------|
| **Root Cause** | `safeApprove()` guards against race condition by blocking non-zero → non-zero approvals |
| **First Call Works** | allowance is 0, so condition `allowance == 0` passes ✅ |
| **Second Call Fails** | allowance is residual > 0, so both conditions fail → REVERT ❌ |
| **Error Message** | `"SafeERC20: approve from non-zero to non-zero allowance"` |
| **Affected Line** | `AeosVestingStrategic.sol:255` |
| **safeTransfer() Revert** | Usually secondary; primary issue is `safeApprove()` preventing further state changes |
| **LIQUIDITY.initializeApproval()** | Uses raw `approve(type(uint256).max)` — risky but OK for trusted contracts; should use `forceApprove()` for robustness |
| **Fix** | Use `forceApprove()` instead (if OZ v4.9.3+), or manually reset to 0 before reapproving |

---

## Recommended Fix (Immediate)

In `AeosVestingStrategic.sol`, line 255, change:

```solidity
// ❌ CURRENT (FAILS ON SECOND CALL)
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);

// ✅ FIXED (WORKS EVERY TIME)
usdtToken.forceApprove(address(liquidity), usdtForLiquidity);
```

Verify OpenZeppelin version >= 4.9.3:
```bash
npm list @openzeppelin/contracts
```

If version is < 4.9.3, upgrade:
```bash
npm install @openzeppelin/contracts@latest
```

Then rebuild and redeploy.

---

## References

- [OpenZeppelin SafeERC20 Source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/utils/SafeERC20.sol)
- [ERC-20 Approve Race Condition (CVE-2018-10627)](https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729)
- [USDT Approval Pattern (Tether-specific quirk)](https://github.com/tetherto/tether/wiki)
