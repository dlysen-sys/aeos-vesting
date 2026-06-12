# Owner-Configurable Period Parameters

## Architecture Overview

Instead of hardcoding period values in VestingMath or contracts, the owner can now update periods for testing/production switching **without redeployment**.

## For Each Contract (Strategic, Advisors, Team)

### 1. Add State Variables

```solidity
// In the contract's variable section

// ⚠️ OWNER-CONFIGURABLE PERIOD PARAMETERS
// TESTING: 1 minute | PRODUCTION: varies by contract
uint256 public quarterlyPeriodSeconds = 1 minutes;  // For Strategic (or monthlyPeriodSeconds for Advisors)
uint256 public yearlyPeriodSeconds = 1 hours;       // For Reserves/Ecosystem
```

### 2. Add Setter Functions

```solidity
/**
 * @dev Set period for unlock calculations (owner only)
 * Use this to switch between testing and production timelines
 * TESTING: 1 minute | PRODUCTION: 90 days (90 days = 7,776,000 seconds)
 */
function setQuarterlyPeriod(uint256 newPeriodSeconds) external onlyOwner {
    require(newPeriodSeconds > 0, "Period must be > 0");
    quarterlyPeriodSeconds = newPeriodSeconds;
}

/**
 * @dev Set yearly period (owner only)
 * TESTING: 1 hour | PRODUCTION: 365 days (365 days = 31,536,000 seconds)
 */
function setYearlyPeriod(uint256 newPeriodSeconds) external onlyOwner {
    require(newPeriodSeconds > 0, "Period must be > 0");
    yearlyPeriodSeconds = newPeriodSeconds;
}
```

### 3. Update VestingMath Function Calls

**Old (hardcoded):**
```solidity
return VestingMath.calculateCliffQuarterlyRelease(
    totalAmount,
    cliffEnd,
    vestingEnd,
    unlockPercentPerPeriod
);
```

**New (parameterized):**
```solidity
return VestingMath.calculateCliffQuarterlyRelease(
    totalAmount,
    cliffEnd,
    vestingEnd,
    unlockPercentPerPeriod,
    quarterlyPeriodSeconds  // ← Pass the state variable
);
```

---

## Testing vs Production Quick Reference

### Strategic (Quarterly Unlock)
```solidity
// TESTING
uint256 public quarterlyPeriodSeconds = 1 minutes;

// PRODUCTION - Owner calls:
setQuarterlyPeriod(7776000);  // 90 days in seconds
```

### Advisors (Monthly Unlock)
```solidity
// TESTING
uint256 public monthlyPeriodSeconds = 9 minutes;

// PRODUCTION - Owner calls:
setMonthlyPeriod(2592000);  // 30 days in seconds
```

### Reserves/Ecosystem (Yearly Unlock)
```solidity
// TESTING
uint256 public yearlyPeriodSeconds = 1 hours;

// PRODUCTION - Owner calls:
setYearlyPeriod(31536000);  // 365 days in seconds
```

---

## Why This Architecture?

✅ **Flexible:** Owner can switch periods without redeployment  
✅ **Safe:** Only owner can change (onlyOwner modifier)  
✅ **Testable:** Easy to test with fast periods  
✅ **Production-Ready:** Switch to real timelines before mainnet  
✅ **Auditable:** All changes logged in contract state  

---

## Implementation Checklist

For each contract (Strategic, Advisors, Team):

- [ ] Add period state variables
- [ ] Add setter functions (onlyOwner)
- [ ] Update VestingMath function calls to pass periods
- [ ] Update getConfiguration() to return periods
- [ ] Test both testing and production values
- [ ] Document in contract comments

---

## Common Period Values (in seconds)

| Period | Testing | Production |
|--------|---------|------------|
| 1 minute | 60 | - |
| 9 minutes | 540 | - |
| 1 hour | 3,600 | - |
| 30 days (monthly) | - | 2,592,000 |
| 90 days (quarterly) | - | 7,776,000 |
| 365 days (yearly) | - | 31,536,000 |

---

## Deployment Workflow

1. **Deploy with testing periods**
2. **Test unlock mechanics**
3. **Verify everything works**
4. **Before mainnet: Owner calls setters**
   ```solidity
   // Switch to production
   setQuarterlyPeriod(7776000);     // 90 days
   setMonthlyPeriod(2592000);       // 30 days
   setYearlyPeriod(31536000);       // 365 days
   ```
5. **Deploy to mainnet**
6. **Verify production timelines**

