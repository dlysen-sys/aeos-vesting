# SafeERC20.safeApprove() Fix Guide — AEOS Vesting

## The Problem in One Line

`safeApprove()` blocks any approval to a **non-zero allowance** — your second purchase reverts because the first one left a residual allowance.

---

## Quick Diagnosis

**Error Message:**
```
Error: SafeERC20: approve from non-zero to non-zero allowance
```

**Location:** `AeosVestingStrategic.sol:255`
```solidity
usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
```

**When It Happens:**
- ✅ First user purchase: works fine
- ❌ Second user purchase: reverts on same line

---

## Fix Options (Choose One)

### Option A: forceApprove() — RECOMMENDED (1 line change)

**Requires:** OpenZeppelin v4.9.3 or later

**Change in `AeosVestingStrategic.sol:255`:**
```diff
- usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
+ usdtToken.forceApprove(address(liquidity), usdtForLiquidity);
```

**That's it.** `forceApprove()` handles clearing the old allowance automatically.

**Check your OZ version first:**
```bash
npm list @openzeppelin/contracts
```

If `< 4.9.3`, upgrade:
```bash
npm install @openzeppelin/contracts@latest
```

---

### Option B: Manual Reset + safeApprove() — COMPATIBLE (2 line change)

**Works with any OpenZeppelin version.**

**Change in `AeosVestingStrategic.sol:255`:**
```diff
  // Try to route 80% to liquidity pool; if fails, send 100% to treasury
  bool liquidityRoutingSuccessful = false;
  if (
      address(liquidity) != address(0) &&
      liquidity.TOKENID() != 0 &&
      usdtForLiquidity > 0
  ) {
-     usdtToken.safeApprove(address(liquidity), usdtForLiquidity);
+     usdtToken.safeApprove(address(liquidity), 0);  // Reset to zero first
+     usdtToken.safeApprove(address(liquidity), usdtForLiquidity);  // Then set new amount
      try liquidity.addLiquidityUSDT(usdtForLiquidity, uint24(slippageBps)) returns (uint256 lpAdded) {
```

**Why it works:**
1. First call: approve(0) → allowance goes 100 → 0 ✅ (value == 0, so check passes)
2. Second call: approve(amount) → allowance goes 0 → amount ✅ (allowance == 0, so check passes)

---

### Option C: safeIncreaseAllowance() — EXPLICIT (3 lines)

```solidity
// Clear any existing allowance
uint256 currentAllowance = usdtToken.allowance(address(this), address(liquidity));
if (currentAllowance > 0) {
    usdtToken.safeDecreaseAllowance(address(liquidity), currentAllowance);
}
// Increase by new amount
usdtToken.safeIncreaseAllowance(address(liquidity), usdtForLiquidity);
```

**Pros:** Clearest intent  
**Cons:** More verbose

---

## Testing the Fix

### 1. Recompile
```bash
cd /path/to/hardhat
npm run compile
```

### 2. Run Tests
```bash
npm run test
# Look for tests that simulate multiple purchases
```

### 3. Deploy & Test on Testnet
```bash
npm run deploy -- --network bscTestnet
```

### 4. Verify with Two Sequential Transactions

In your test suite or frontend:

```javascript
// User 1 buys
await contract.buyStrategicVesting(100 * 1e18);  // 100 USDT
console.log("User 1 purchased ✅");

// User 2 buys (THIS SHOULD NOW WORK)
await contract.buyStrategicVesting(50 * 1e18);   // 50 USDT
console.log("User 2 purchased ✅");
```

**Before fix:** User 2 reverts  
**After fix:** Both succeed ✅

---

## Also Fix: AeosLiquidityManager.initializeApproval()

While you're at it, improve lines 310–315 in `AeosLiquidityManager.sol`:

**Current (raw approve, potential issue):**
```solidity
function initializeApproval() external onlyOwner nonReentrant {
    IERC20(USDT).approve(address(POSITION_MANAGER), type(uint256).max);
    IERC20(AEOS).approve(address(POSITION_MANAGER), type(uint256).max);
    IERC20(USDT).approve(address(SWAP_ROUTER), type(uint256).max);
    IERC20(AEOS).approve(address(SWAP_ROUTER), type(uint256).max);
}
```

**Improved (forceApprove, handles any prior allowance):**
```solidity
function initializeApproval() external onlyOwner nonReentrant {
    IERC20(USDT).forceApprove(address(POSITION_MANAGER), type(uint256).max);
    IERC20(AEOS).forceApprove(address(POSITION_MANAGER), type(uint256).max);
    IERC20(USDT).forceApprove(address(SWAP_ROUTER), type(uint256).max);
    IERC20(AEOS).forceApprove(address(SWAP_ROUTER), type(uint256).max);
}
```

**Why:** `forceApprove()` explicitly resets to 0 before approving, so if this function is accidentally called twice, it still works. Raw `approve()` *would* work, but `forceApprove()` is more robust.

---

## Why This Happened

OpenZeppelin's `safeApprove()` was designed to **prevent a race condition in ERC-20 approvals**:

```
Old Paradigm (unsafe):
  approve(spender, 100)   // User wants to reduce to 100
  approve(spender, 50)    // User wants to reduce to 50
  
  Spender can front-run and spend all 100 before the second approve lands,
  leaving the user with less than expected.
```

OpenZeppelin's guard:
```
✅ ALLOWED:  approve(0)           → no amount set yet (safe)
✅ ALLOWED:  approve(X)           → set initial allowance (safe)
❌ BLOCKED:  approve(Y != X)      → tried to change non-zero → non-zero (unsafe!)
```

**The fix:** Don't try to change a non-zero allowance. Either:
1. Reset to 0 first, **then** set new amount (Option B), or
2. Use `forceApprove()` which does this automatically (Option A), or
3. Use `safeIncreaseAllowance()` / `safeDecreaseAllowance()` (Option C)

---

## Which Option to Choose?

| Scenario | Recommendation |
|----------|---|
| **Using OZ v4.9.3+** | Option A (`forceApprove`) — cleanest, 1 line |
| **Using OZ v4.x < 4.9.3** | Upgrade first, then Option A |
| **Can't upgrade (locked version)** | Option B (manual reset) — 2 lines, works everywhere |
| **Want maximum clarity** | Option C (`safeIncreaseAllowance`) — verbose but explicit |

---

## Implementation Checklist

- [ ] Choose fix option (A, B, or C)
- [ ] Update `AeosVestingStrategic.sol:255`
- [ ] Update `AeosLiquidityManager.sol:310-315` (use `forceApprove`)
- [ ] Verify OpenZeppelin version (if using Option A)
- [ ] Recompile: `npm run compile`
- [ ] Run tests: `npm run test`
- [ ] Deploy to testnet: `npm run deploy -- --network bscTestnet`
- [ ] Test two sequential purchases in testnet
- [ ] Merge & deploy to mainnet

---

## Verification Command

After deployment, verify the fix works with this test:

```bash
# In hardhat console or test file
const tx1 = await vesting.buyStrategicVesting("100000000000000000000"); // 100 USDT
await tx1.wait();
console.log("✅ Purchase 1 succeeded");

const tx2 = await vesting.buyStrategicVesting("50000000000000000000");  // 50 USDT
await tx2.wait();
console.log("✅ Purchase 2 succeeded");

console.log("All tests passed! 🎉");
```

If both logs appear → fix is working.

---

## Deep Dive (Optional Reading)

See `SAFERC20_ANALYSIS.md` for:
- Detailed explanation of the race condition
- Why `safeApprove()` vs. `approve()` vs. `safeIncreaseAllowance()`
- OpenZeppelin internals
- Why LIQUIDITY.initializeApproval() uses raw `approve()`
