# SOP: Manual Strategic Vesting Management

**Scope:** `addStrategicVesting` and `updateStrategicVesting` in AeosVestingStrategic.sol  
**Access:** Owner only  
**UI Path:** Admin → Strategic → Manage Vestings tab

---

## When to Use

| Scenario | Function |
|----------|----------|
| Off-chain USDT payment received, need to record vesting on-chain | `addStrategicVesting` |
| Migration from old contract or spreadsheet data | `addStrategicVesting` |
| Correcting wrong amount, timestamp, or cliff after a record was created | `updateStrategicVesting` |
| Manually marking a vesting as completed | `updateStrategicVesting` |
| Adjusting released amount after a manual token send | `updateStrategicVesting` |

---

## addStrategicVesting

### What It Does
Creates a new `Investment` record for a user with no token transfer of any kind.  
No USDT is pulled. No liquidity routing occurs. No referral bonus is distributed.  
`cliffEnd` and `vestingEnd` are calculated automatically from `timestamp` using the current `cliffPeriodSeconds` and `vestingEndSeconds` values at the time of the call.

### Contract Signature
```solidity
function addStrategicVesting(
    address user,      // Beneficiary wallet
    uint256 amount,    // AEOS in wei (18 decimals)
    uint256 timestamp  // Unix timestamp — must be <= block.timestamp
) external onlyOwner
```

### Parameters

| Param | Type | Notes |
|-------|------|-------|
| `user` | address | Must not be zero address |
| `amount` | uint256 | AEOS in wei — e.g. 50,000 AEOS = `50000 * 1e18` |
| `timestamp` | uint256 | Unix timestamp, must be ≤ current block time. Use the original off-chain purchase date. |

### Validations
- `user != address(0)`
- `amount > 0`
- `timestamp > 0 && timestamp <= block.timestamp` — future dates not allowed
- `totalSold + amount <= ALLOCATION` (100M AEOS hard cap)

### Effects
- Adds new entry to `investments[user][]`
- Increments `totalSold`, `totalAllocated`, `totalAeosClaimable`
- Emits `StrategicVestingAdded` and `FundingRequirementUpdated`

### Step-by-Step (UI)
1. Go to **Admin → Strategic → Manage Vestings tab**
2. Select **Add Vesting** sub-tab
3. Enter beneficiary address
4. Enter AEOS amount (whole number, e.g. `50000`)
5. Set purchase timestamp — use the original payment date, not today if it was an older purchase
6. Click **Add Vesting Record**
7. Confirm MetaMask transaction
8. Verify by checking the investor's dashboard or calling `getInvestorSummary(user)`

### Important Notes
- cliff and vesting end are derived from the CURRENT contract configuration at call time — not from when the original purchase occurred. If you changed `cliffPeriodSeconds` after the original purchase, set them manually using `updateStrategicVesting` instead.
- Does NOT fund the contract. After adding records, check `getFundingStatus()` and deposit AEOS via **Deposit AEOS** tab if needed.

---

## updateStrategicVesting

### What It Does
Overwrites every field of an existing `Investment` record.  
Automatically reconciles `totalSold`, `totalAllocated`, and `totalAeosClaimable` based on the delta between old and new values.

### Contract Signature
```solidity
function updateStrategicVesting(
    address user,   // Investment owner
    uint256 index,  // Index in investments[user] array (0-based)
    InvestmentUpdate calldata u  // Struct with all updated fields
) external onlyOwner

struct InvestmentUpdate {
    uint256 amount;
    uint256 released;
    uint256 purchaseTime;
    uint256 releasedTime;
    uint256 cliffEnd;
    uint256 vestingEnd;
    bool    isCompleted;
}
```

### Parameters

| Param | Type | Notes |
|-------|------|-------|
| `user` | address | Must not be zero address |
| `index` | uint256 | Must be < `investments[user].length` |
| `u.amount` | uint256 | New total AEOS in wei |
| `u.released` | uint256 | New released amount in wei — must be <= amount |
| `u.purchaseTime` | uint256 | Unix timestamp of original purchase |
| `u.releasedTime` | uint256 | Unix timestamp of last withdrawal |
| `u.cliffEnd` | uint256 | Unix timestamp when cliff expires — must be <= vestingEnd |
| `u.vestingEnd` | uint256 | Unix timestamp when full vesting expires |
| `u.isCompleted` | bool | true = record is closed, no further withdrawals |

### Validations
- `user != address(0)`
- `index < investments[user].length`
- `u.released <= u.amount`
- `u.cliffEnd <= u.vestingEnd`
- If increasing amount: `totalSold + delta <= ALLOCATION`

### Effects
- Overwrites all 7 fields of the investment record
- Reconciles `totalSold` ± delta of amount change
- Reconciles `totalAllocated` and `totalAeosClaimable` ± delta of unreleased change
- Emits `StrategicVestingUpdated` and `FundingRequirementUpdated`

### Step-by-Step (UI)
1. Go to **Admin → Strategic → Manage Vestings tab**
2. Select **Edit Vesting** sub-tab
3. Enter the investor's address
4. Enter the investment index (check `getInvestorSummary` or `getInvestmentCount` to verify the index)
5. Fill in ALL fields — every field is written on save
6. Check **Mark as Completed** if closing the record
7. Click **Update Vesting Record**
8. Confirm MetaMask transaction
9. Verify by calling `getInvestmentDetails(user, index)`

### Critical Rules
1. **All fields are required.** The function writes all 7 fields every call — leaving one blank means writing 0 to it.
2. **released must be <= amount.** If you increase `released` above `amount`, the transaction reverts.
3. **cliffEnd must be <= vestingEnd.** A cliff after the vesting end will revert.
4. **Completing a record (`isCompleted: true`) prevents any future withdrawals.** The user cannot claim after this.
5. **Reconciliation is automatic.** You do NOT need to manually adjust `totalSold` or `totalAllocated`.

---

## Global State Reconciliation (How It Works)

`updateStrategicVesting` adjusts three counters based on the before/after deltas:

```
Old unreleased = old.amount - old.released
New unreleased = new.amount - new.released

If amount increased → totalSold += delta
If amount decreased → totalSold -= delta

If unreleased increased → totalAllocated += delta, totalAeosClaimable += delta
If unreleased decreased → totalAllocated -= delta, totalAeosClaimable -= delta
```

This ensures funding gap calculations remain accurate after any manual edit.

---

## Verification Checklist

After `addStrategicVesting`:
- [ ] `getInvestorSummary(user)` shows new investment count
- [ ] `getInvestmentDetails(user, newIndex)` shows correct amount and timestamps
- [ ] `totalSold` increased by amount
- [ ] `getFundingStatus()` shows updated funding gap

After `updateStrategicVesting`:
- [ ] `getInvestmentDetails(user, index)` reflects all updated fields
- [ ] `totalSold` changed by amount delta (if any)
- [ ] `getFundingStatus()` shows updated funding gap
- [ ] Completion flag is correct

---

## Common Mistakes to Avoid

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using today's date as `timestamp` when the original purchase was 3 months ago | Wrong cliff end (3 months later than intended) | Use original purchase date |
| Leaving `releasedTime` blank → writes 0 | Resets withdrawal cooldown to epoch 0, next withdrawal unlocks all past periods at once | Copy from on-chain `releasedTime` |
| Setting `released > amount` | Transaction reverts | Ensure released ≤ amount |
| Marking `isCompleted: true` by mistake | User can no longer claim | Call `updateStrategicVesting` again with `isCompleted: false` |

---

**File:** `references/sops/strategic-manual-vesting.md`  
**Last Updated:** 2026-06-13
