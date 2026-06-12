# Production Rollback Guide

## When Deploying to Mainnet (Revert Testing Values)

This document shows exactly what to change when moving from **testing** to **production**.

---

## Testing vs Production Values

### AeosVestingStrategic.sol

**Line 60 - CLIFF PERIOD:**
```solidity
// TESTING:
uint256 public cliffPeriodSeconds = 18 minutes;

// PRODUCTION - Replace with:
uint256 public cliffPeriodSeconds = 180 days;
```

**Line 66-67 - VESTING END TIME:**
```solidity
// TESTING:
uint256 public vestingEndSeconds = 3 hours;

// PRODUCTION - Replace with:
uint256 public vestingEndSeconds = 1800 days; // 60 months * 30 days
```

**Line 71 - WITHDRAWAL PERIOD:**
```solidity
// TESTING:
uint256 public withdrawalPeriod = 9 minutes;

// PRODUCTION - Replace with:
uint256 public withdrawalPeriod = 90 days;
```

**Line 125-126 - VESTING END CALCULATION:**
```solidity
// Currently uses:
uint256 vestingEnd = block.timestamp + vestingEndSeconds;

// In production, if using months instead:
uint256 vestingEnd = block.timestamp + (totalVestingMonths * 30 days);
```

---

### AeosVestingAdvisors.sol

**Line 59 - CLIFF PERIOD:**
```solidity
// TESTING:
uint256 public cliffPeriodSeconds = 36 minutes;

// PRODUCTION - Replace with:
uint256 public cliffPeriodSeconds = 360 days; // 12 months
```

**Line 66-67 - VESTING END TIME:**
```solidity
// TESTING:
uint256 public vestingEndSeconds = 4 hours;

// PRODUCTION - Replace with:
uint256 public vestingEndSeconds = 1440 days; // 48 months * 30 days
```

**Line 71 - WITHDRAWAL PERIOD:**
```solidity
// TESTING:
uint256 public withdrawalPeriod = 9 minutes;

// PRODUCTION - Replace with:
uint256 public withdrawalPeriod = 90 days;
```

**Line 124-125 - VESTING END CALCULATION:**
```solidity
// Currently uses:
uint256 vestingEnd = block.timestamp + vestingEndSeconds;

// In production, if using months instead:
uint256 vestingEnd = block.timestamp + (totalVestingMonths * 30 days);
```

---

### AeosVestingTeam.sol

**Line 27 - CLIFF PERIOD:**
```solidity
// TESTING:
uint256 public constant CLIFF_SECONDS = 54 minutes;

// PRODUCTION - Replace with:
uint256 public constant CLIFF_SECONDS = 540 days; // 18 months
```

**Line 34 - VESTING END TIME:**
```solidity
// TESTING:
uint256 public constant VESTING_END_SECONDS = 5 hours;

// PRODUCTION - Replace with:
uint256 public constant VESTING_END_SECONDS = 1800 days; // 60 months * 30 days
```

**Line 61-62 - VESTING END CALCULATION:**
```solidity
// Currently uses:
uint256 vestingEnd = block.timestamp + VESTING_END_SECONDS;

// In production, if using months instead:
uint256 vestingEnd = block.timestamp + (VESTING_MONTHS * 30 days);
```

---

## VestingMath.sol (Period Constants)

**Lines 11-21 - PERIOD CONSTANTS:**

```solidity
// TESTING:
uint256 internal constant MONTHLY_PERIOD = 9 minutes;
uint256 internal constant QUARTERLY_PERIOD = 9 minutes;
uint256 internal constant YEARLY_PERIOD = 1 hours;

// PRODUCTION - Replace all three with:
uint256 internal constant MONTHLY_PERIOD = 30 days;
uint256 internal constant QUARTERLY_PERIOD = 90 days;
uint256 internal constant YEARLY_PERIOD = 365 days;
```

**All occurrences replaced:** Lines 47, 50, 51, 53, 97, 100, 196

---

## Quick Reference Table

| Module | Parameter | Testing | Production |
|--------|-----------|---------|------------|
| Strategic | Cliff | 18 minutes | 180 days (6 months) |
| Strategic | Total Vesting | 3 hours | 1800 days (60 months) |
| Strategic | Withdrawal Period | 9 minutes | 90 days |
| Advisors | Cliff | 36 minutes | 360 days (12 months) |
| Advisors | Total Vesting | 4 hours | 1440 days (48 months) |
| Advisors | Withdrawal Period | 9 minutes | 90 days |
| Team | Cliff | 54 minutes | 540 days (18 months) |
| Team | Total Vesting | 5 hours | 1800 days (60 months) |

---

## All Files to Update Before Production

1. **AeosVestingStrategic.sol** — Lines 60, 66-67, 71, 548-551
2. **AeosVestingAdvisors.sol** — Lines 59, 66-67, 71, 539-542
3. **AeosVestingTeam.sol** — Lines 27, 34, 61-62
4. **VestingMath.sol** — Lines 11-21 (all 3 period constants)

## Deployment Checklist

Before deploying to mainnet:

- [ ] Update all 3 contracts: cliff, vesting, withdrawal period values
- [ ] Update VestingMath.sol: MONTHLY_PERIOD, QUARTERLY_PERIOD, YEARLY_PERIOD
- [ ] Run: `npm run compile` (verify no errors)
- [ ] Run: `npm run test` (verify all tests pass)
- [ ] Deploy to BSC Testnet first: `npm run deploy -- --network bscTestnet`
- [ ] Test all functions on testnet with production timelines
- [ ] Deploy to BSC Mainnet: `npm run deploy:bsc`
- [ ] Verify contract on BSCScan

---

## Notes

- All time values use **seconds** internally (not months)
- Comments in the source code show both testing and production values
- The setter functions (`setVestingConfiguration`) will convert month inputs to seconds
- No changes needed to unlock percentages (5%, 2.5%, 2%)
- No changes needed to treasury/liquidity routing logic

