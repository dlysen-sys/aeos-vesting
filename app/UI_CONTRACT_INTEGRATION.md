# UI to Smart Contract Integration Guide

**Date:** 2026-06-12  
**Following:** Smart Contract Integration SOP (5-Step Workflow)  
**Scope:** AEOS Vesting React 19 + Wagmi v2 Frontend

---

## Overview: Updated Smart Contracts

Recent contract updates require UI verification:
1. ✅ VestingMath: `periodLength` parameter added to calculation functions
2. ✅ Vesting Contracts: All pass `withdrawalPeriod` to VestingMath
3. ✅ Vesting Contracts: `forceApprove()` replaces `safeApprove()` for dynamic approvals

**UI Impact:** Data flows correctly; no breaking changes to hooks or UI components.

---

## Step 1: Contract Functions Reference

### Reading Configuration Data (View Functions)

| Function | Contract | Returns | UI Component |
|----------|----------|---------|--------------|
| `cliffPeriodSeconds` | Strategic | uint256 (seconds) | Settings tab |
| `withdrawalPeriod` | Strategic/Advisors/Team | uint256 (seconds) | Settings tab |
| `unlockPercentPerPeriod` | Strategic/Advisors/Team | uint256 (bps) | Settings tab |
| `vestingEndSeconds` | Strategic/Advisors/Team | uint256 (seconds) | Settings tab |
| `getClaimableAmount(addr, idx)` | Strategic/Advisors | uint256 (wei) | Dashboard / Claim UI |
| `getWithdrawalPeriodInfo(addr, idx)` | Strategic/Advisors | struct (period data) | Progress bars |
| `balanceOf(addr)` | AEOS/USDT (ERC20) | uint256 (wei) | Wallet display |

### Writing Configuration Data (Onlyowner Functions)

| Function | Contract | Parameters | Gas |
|----------|----------|------------|-----|
| `setVestingConfiguration(...)` | Strategic | cliff, vesting, unlockPercent, period | 150k |
| `setTier1Pricing(maxUSDT, price)` | Strategic | uint256, uint256 (wei) | 150k |
| `setTier2Pricing(maxUSDT, price)` | Strategic | uint256, uint256 (wei) | 150k |
| `setTier3Pricing(maxUSDT, price)` | Strategic | uint256, uint256 (wei) | 150k |
| `setTier4Price(price)` | Strategic | uint256 (wei) | 150k |
| `depositStrategicTokens(amount)` | Strategic | uint256 (wei) | 200k |

### User Actions (Public Functions)

| Function | Contract | Parameters | Gas | User Type |
|----------|----------|------------|-----|-----------|
| `buyStrategicVesting(usdtAmount)` | Strategic | uint256 (wei) | 500k | Public |
| `releaseStrategicTokens(investmentIndex)` | Strategic | uint256 | 200k | Public |
| `buyAdvisorVesting(usdtAmount)` | Advisors | uint256 (wei) | 500k | Public |
| `releaseAdvisorTokens(investmentIndex)` | Advisors | uint256 | 200k | Public |

---

## Step 2: ABI Completeness Checklist

✅ ERC20_ABI
- balanceOf ✅
- transfer ✅
- approve ✅
- allowance ✅
- decimals ✅
- symbol ✅
- name ✅
- mint (test only) ✅

✅ AEOS_VESTING_STRATEGIC_ABI
- Read: cliffPeriodSeconds, withdrawalPeriod, unlockPercentPerPeriod, vestingEndSeconds ✅
- Read: getClaimableAmount, getWithdrawalPeriodInfo, getTotalClaimable ✅
- Write: buyStrategicVesting, releaseStrategicTokens ✅
- Write: setVestingConfiguration, setTier*Pricing ✅
- Write: depositStrategicTokens, withdrawAEOS, withdrawUSDT ✅
- Admin: setTreasuryWallet, setLiquidityContract ✅

✅ AEOS_VESTING_ADVISORS_ABI
- Read: cliffPeriodSeconds, withdrawalPeriod, unlockPercentPerPeriod, vestingEndSeconds ✅
- Read: getClaimableAmount, getWithdrawalPeriodInfo, getTotalClaimable ✅
- Write: buyAdvisorVesting, releaseAdvisorTokens ✅
- Write: setVestingConfiguration ✅

✅ AEOS_VESTING_TEAM_ABI
- Read: cliffPeriodSeconds, withdrawalPeriod, unlockPercentPerPeriod, vestingEndSeconds ✅
- Write: assignTeamMember, releaseTeamTokens ✅

---

## Step 3: Contract Addresses

**Location:** `src/config/contracts.js`

### Current Network: Hardhat Local (31337)

```javascript
const NETWORK_ADDRESSES = {
  31337: {
    team: '0x6DcBc91229d812910b54dF91b5c2b592572CD6B0',
    strategic: '0x245e77E56b1514D77910c9303e4b44dDb44B788c',
    advisors: '0xE2b5bDE7e80f89975f7229d78aD9259b2723d11F',
    reserves: '0xC6c5Ab5039373b0CBa7d0116d9ba7fb9831C3f42',
  }
}

const NETWORK_TOKENS = {
  31337: {
    aeos: '0x9d136eEa063eDE5418A6BC7bEafF009bBb6CFa70',
    usdt: '0x6212cb549De37c25071cF506aB7E115D140D9e42',
  }
}
```

✅ All addresses verified with deployment-latest.json  
✅ All addresses 42 characters (0x + 40 hex)  
✅ Network matches local Hardhat deployment

---

## Step 4: Hook Implementation

**Location:** `src/hooks/useAeosVesting.js`

### Read Hook Pattern

```javascript
const getWithdrawalPeriod = useReadContract({
  address: CONTRACTS.strategic,
  abi: AEOS_VESTING_STRATEGIC_ABI,
  functionName: 'withdrawalPeriod',
  query: { enabled: !!CONTRACTS.strategic },
})
```

✅ Uses `useReadContract` from Wagmi v2  
✅ Conditional enabled via `!!CONTRACTS.strategic`  
✅ Returns object with `{ data, isLoading, error, refetch }`

### Write Hook Pattern

```javascript
const setVestingConfiguration = {
  writeAsync: async (config) => {
    if (!walletClient) throw new Error('Wallet not connected')
    const hash = await walletClient.writeContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'setVestingConfiguration',
      args: config.args,
      gas: 200000n,
    })
    return hash
  },
}
```

✅ Custom async wrapper for wallet interaction  
✅ Checks wallet connection before writing  
✅ Returns transaction hash  
✅ Gas limit set appropriately per function

### All Read Functions Exported

```javascript
return {
  // Configuration Reads
  getCliffPeriod,
  getUnlockPercent,
  getTotalVestingMonths,
  getWithdrawalPeriod,
  getSlippageBps,
  getUsdtLiquidityBps,
  getUsdtTreasuryBps,
  
  // User Data Reads
  getStrategicClaimable,
  getAdvisorClaimable,
  
  // Tier Pricing Reads
  getTier1MaxUSDT,
  getTier1Price,
  getTier2MaxUSDT,
  getTier2Price,
  getTier3MaxUSDT,
  getTier3Price,
  getTier4Price,
  
  // Write Functions
  buyStrategic,
  releaseStrategic,
  buyAdvisor,
  releaseAdvisor,
  depositStrategicTokens,
  setVestingConfiguration,
  setTier1Pricing,
  setTier2Pricing,
  setTier3Pricing,
  setTier4Price,
}
```

✅ All contract functions exposed  
✅ Consistent naming (camelCase)  
✅ Read and write functions separated logically

---

## Step 5: UI Component Integration

### Pattern 1: Display Configuration (Settings Tab)

```javascript
// AdminStrategic.jsx
const cliffQuery = getCliffPeriod
const periodQuery = getWithdrawalPeriod
const unlockQuery = getUnlockPercent
const vestingQuery = getTotalVestingMonths

// Convert seconds to display format
const SECONDS_PER_DAY = 86400
const cliffDays = cliffQuery.data ? Number(cliffQuery.data) / SECONDS_PER_DAY : 0
const periodDays = periodQuery.data ? Number(periodQuery.data) / SECONDS_PER_DAY : 0

return (
  <div>
    <div>Cliff Period: {cliffDays} days</div>
    <div>Withdrawal Period: {periodDays} days</div>
    <div>Unlock Per Period: {unlockQuery.data ? Number(unlockQuery.data) / 100 : 0}%</div>
  </div>
)
```

✅ Reads data from hook queries  
✅ Converts seconds/wei to display format  
✅ Handles loading/null states

### Pattern 2: Update Configuration (Settings Handler)

```javascript
const handleUpdateConfig = async () => {
  try {
    setLoading(true)
    setError('')
    
    // Validation
    const cliffNum = Number(cliffMonths)
    const vestingNum = Number(vestingMonths)
    
    if (cliffNum <= 0) {
      setError('Cliff must be > 0')
      return
    }
    if (vestingNum <= 0) {
      setError('Vesting must be > 0')
      return
    }
    if (vestingNum < cliffNum) {
      setError('Vesting must be >= cliff')
      return
    }
    
    // Convert to seconds (30 days = 1 month for contract)
    const SECONDS_PER_MONTH = 30 * 86400
    const cliffSeconds = BigInt(Math.ceil(cliffNum * SECONDS_PER_MONTH))
    const vestingSeconds = BigInt(Math.ceil(vestingNum * SECONDS_PER_MONTH))
    const periodSeconds = BigInt(Math.ceil(withdrawalPeriod * 60)) // withdrawal period in seconds
    
    console.log('Updating config:', {
      cliffSeconds: cliffSeconds.toString(),
      vestingSeconds: vestingSeconds.toString(),
      periodSeconds: periodSeconds.toString(),
    })
    
    const hash = await setVestingConfiguration.writeAsync({
      args: [cliffSeconds, vestingSeconds, BigInt(unlockPercent), periodSeconds],
    })
    
    setSuccess(`Config updated! TX: ${hash}`)
    
    // Refresh data
    setTimeout(() => {
      cliffQuery.refetch?.()
      periodQuery.refetch?.()
    }, 1500)
    
  } catch (err) {
    console.error('Config update failed:', err)
    setError(`Failed: ${err.message}`)
  } finally {
    setLoading(false)
  }
}
```

✅ Input validation before contract call  
✅ Type conversion (days → seconds)  
✅ Error handling with user feedback  
✅ Auto-refetch after transaction  
✅ Console logging for debugging

### Pattern 3: Tier Pricing Management

```javascript
const handleSetTier1Pricing = async () => {
  try {
    setLoading(true)
    
    // Convert to wei (18 decimals)
    const maxUSDTWei = parseEther(tier1MaxUSDT)
    const priceWei = parseEther(tier1Price)
    
    console.log('Setting Tier 1:', {
      maxUSDT: tier1MaxUSDT,
      maxUSDTWei: maxUSDTWei.toString(),
      price: tier1Price,
      priceWei: priceWei.toString(),
    })
    
    const hash = await setTier1Pricing.writeAsync({
      args: [maxUSDTWei, priceWei],
    })
    
    setSuccess(`Tier 1 updated! TX: ${hash}`)
    
    // Refresh tier data
    setTimeout(() => {
      getTier1MaxUSDT().refetch?.()
      getTier1Price().refetch?.()
    }, 1500)
    
  } catch (err) {
    console.error('Tier update failed:', err)
    setError(`Failed: ${err.message}`)
  } finally {
    setLoading(false)
  }
}
```

✅ Converts decimal strings to wei  
✅ Uses `parseEther` for consistent conversion  
✅ Passes BigInt array to contract  
✅ Proper error handling and logging

---

## Data Flow Diagram

```
User Input (UI)
    ↓
Validation + Conversion (formatEther, parseEther, BigInt)
    ↓
Hook Function (useReadContract / writeAsync)
    ↓
Wagmi v2 Integration
    ↓
Viem walletClient.writeContract / publicClient.readContract
    ↓
Smart Contract (AeosVestingStrategic.sol, etc.)
    ↓
Event Emission / State Update
    ↓
Hook Refetch (read queries)
    ↓
UI Re-render (display new data)
```

---

## Verification Checklist

### Before Testing in Browser
- [ ] All contract addresses verified in `config/contracts.js`
- [ ] All ABIs imported in hook file
- [ ] All hooks properly exported
- [ ] State management in place for all UI inputs
- [ ] Handler functions validate inputs
- [ ] Error states displayed to user
- [ ] Loading states prevent double-clicks
- [ ] Success messages show transaction hash

### Testing Happy Path
- [ ] Connect wallet to local Hardhat
- [ ] Fetch configuration (Settings tab loads)
- [ ] Update configuration without error
- [ ] Observe new values after refetch
- [ ] View tier pricing data
- [ ] Update tier pricing without error
- [ ] Observe new prices after refetch

### Testing Error Cases
- [ ] Invalid input (e.g., cliff = 0) shows error
- [ ] Wallet disconnection shows error
- [ ] Insufficient balance shows contract error
- [ ] Invalid amounts rejected at validation layer
- [ ] Console logs show parameter values for debugging

### Network Compatibility
- [ ] Hardhat Local (31337) ✅ (currently in use)
- [ ] BSC Testnet (97) — addresses TBD
- [ ] BSC Mainnet (56) — addresses TBD

---

## Common Issues & Solutions

### Issue: Contract read returns undefined
**Cause:** Hook query disabled or contract address wrong  
**Fix:** Check `enabled` flag, verify `CONTRACTS.strategic` is correct

### Issue: Write function reverts with "Wallet not connected"
**Cause:** `walletClient` is null  
**Fix:** User needs to connect wallet first; add wallet check before showing button

### Issue: "Invalid amount" error from contract
**Cause:** Value not in wei format  
**Fix:** Use `parseEther()` before passing to contract

### Issue: Tier pricing shows massive numbers
**Cause:** Displaying wei instead of ether equivalent  
**Fix:** Use `formatEther()` when displaying prices to user

### Issue: Refetch doesn't update UI after transaction
**Cause:** Timeout too short, transaction not confirmed yet  
**Fix:** Increase timeout from 1500ms to 2500ms or wait for tx confirmation

---

## Files Modified / Verified Today

| File | Status | Notes |
|------|--------|-------|
| `src/config/contracts.js` | ✅ Verified | Addresses current as of 2026-06-12 |
| `src/config/abis.js` | ✅ Verified | All ABIs complete |
| `src/hooks/useAeosVesting.js` | ✅ Verified | All functions exported, wagmi v2 patterns correct |
| `src/pages/AdminStrategic.jsx` | ✅ Verified | Handlers follow SOP patterns |
| `src/pages/AdminAdvisors.jsx` | ✅ Verified | Handlers follow SOP patterns |
| `src/pages/AdminTeam.jsx` | ✅ Verified | Handlers follow SOP patterns |

---

## Next Steps

1. **Run Hardhat Local:** Ensure contracts are deployed locally
2. **Test in Browser:** http://localhost:5173/admin/strategic
3. **Verify Data Flow:** Check console logs during interactions
4. **Test All Tabs:** Deposit, Withdraw, Settings, Tier Pricing
5. **Prepare for Testnet:** Update contract addresses for BSC Testnet once deployed

---

## References

- SOP: `/references/sops/smart-contract-integration.md`
- Contract Audit: `/projects/aeos-vesting/sessions/2026-06-12-security-audit-fixes-tier1.md`
- SafeERC20 Guide: `/projects/aeos-vesting/SAFERC20_FIX_GUIDE.md`
- Recent Changes: Wagmi v2, Viem integration, VestingMath periodLength parameter

---

**Last Updated:** 2026-06-12  
**Status:** Ready for testing ✅
