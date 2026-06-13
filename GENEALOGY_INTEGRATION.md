# Genealogy Integration Guide

**Complete implementation of AeosGenealogy smart contract + React UI**

---

## Overview

This guide covers:
- ✅ Smart Contract SOP for genealogy integration
- ✅ Custom React hooks for genealogy queries
- ✅ Admin genealogy management UI tab
- ✅ Referral reward crediting system
- ✅ Testing & deployment checklist

---

## Files Created

### 1. Smart Contract SOP
**Location:** `/references/sops/genealogy-smart-contract-integration.md`

Contains:
- Setup instructions for genealogy contract reference
- Custom hook implementation patterns
- Integration checklist (referral bonus, admin management)
- Error handling & validation
- Monitoring & maintenance

### 2. Custom React Hook
**Location:** `/app/src/hooks/useAeosGenealogy.js`

Exports:
```javascript
const genealogy = useAeosGenealogy()

// READ functions (view-only)
genealogy.getAffiliate(userAddress)        // Returns {parent, directCount}
genealogy.getAffiliateChildren(userAddress) // Returns address[]
genealogy.getBinary(userAddress)            // Returns {parent, leftAddr, rightAddr}
genealogy.isUserRegistered(userAddress)     // Returns boolean
genealogy.checkIsAdmin(userAddress)         // Returns boolean

// WRITE functions (state-changing)
genealogy.addAdmin(adminAddress)            // Tx hash
genealogy.removeAdmin(adminAddress)         // Tx hash
genealogy.updateAffiliateData(user, parent) // Tx hash
genealogy.updateBinaryData(user, parent, left, right) // Tx hash
```

### 3. Admin Genealogy Component
**Location:** `/app/src/pages/AdminGenealogy.jsx`

Provides 4 tabs:
- **Check User** — Query user registration & genealogy info
- **Manage Admins** — Add/remove admin addresses
- **Update Affiliate** — Change user's sponsor (migration)
- **Update Binary** — Update binary tree placement

### 4. Admin Page Integration
**Location:** `/app/src/pages/Admin.jsx`

Added:
- Tab navigation with Genealogy button
- State management for active tab
- Genealogy tab rendering
- Import of AdminGenealogy component

---

## Quick Start

### Step 1: Set Genealogy Contract Address

Update your contract addresses:

```javascript
// app/src/config/contracts.js
export const CONTRACTS = {
  // ... existing contracts
  genealogy: '0x...your_genealogy_address...',
}
```

### Step 2: Verify Hook Integration

The hook is already created and ready to use. Test it:

```javascript
import { useAeosGenealogy } from '../hooks/useAeosGenealogy'

function MyComponent() {
  const genealogy = useAeosGenealogy()
  
  const checkUser = async (address) => {
    const info = await genealogy.getAffiliate(address)
    console.log('Sponsor:', info.parent)
  }
}
```

### Step 3: Verify Admin UI

Navigate to Admin page and click the "Genealogy" tab. You should see 4 sub-tabs:
- Check User
- Manage Admins
- Update Affiliate
- Update Binary

### Step 4: Test on Testnet

1. **Check User**
   - Enter a registered user address
   - Verify sponsor info displays correctly

2. **Manage Admins**
   - Add a test admin address
   - Verify event emitted in transaction logs
   - Remove the test admin

3. **Update Affiliate**
   - Enter user and new parent address
   - Verify old parent's children array updated
   - Verify new parent's children array updated

4. **Update Binary**
   - Enter user with new binary placement
   - Verify binary tree structure changed

---

## Integration Points

### In AeosVestingStrategic

Referral bonus is **already implemented**:

```solidity
// buyStrategicVesting() — Line ~242
if (address(genealogy) != address(0)) {
    (address sponsor, ) = genealogy.getAffiliate(msg.sender);
    if (sponsor != address(0)) {
        uint256 referralBonus = (aeosAmount * REFERRAL_BONUS_BPS) / BPS;
        if (referralBonus > 0) {
            referralRewards[sponsor] += referralBonus;
            totalReferralRewarded += referralBonus;
            emit ReferralRewardCredited(sponsor, msg.sender, referralBonus);
        }
    }
}
```

User can claim referral rewards:
```solidity
// claimReferralRewards() — Line ~388
function claimReferralRewards() external nonReentrant {
    uint256 rewards = referralRewards[msg.sender];
    require(rewards > 0, "No referral rewards to claim");
    referralRewards[msg.sender] = 0;
    aeosToken.safeTransfer(msg.sender, rewards);
    emit ReferralRewardsClaimed(msg.sender, rewards);
}
```

### In AeosGenealogy

Admin system is **already implemented**:

```solidity
// Add admin
function addAdmin(address adminAddress) external onlyOwner { ... }

// Remove admin
function removeAdmin(address adminAddress) external onlyOwner { ... }

// Check if admin
modifier isAdmin() {
    require(msg.sender == owner() || isAdmin[msg.sender], "NOT_AUTHORIZED_ADMIN");
    _;
}
```

All restricted functions use `isAdmin` modifier:
- `updateAffiliateData()` ← Requires owner or admin
- `updateBinaryData()` ← Requires owner or admin
- `updateIsUser()` ← Requires owner or admin
- `setTransactionCooldown()` ← Requires owner or admin
- `setMaxIteration()` ← Requires owner or admin

---

## Deployment Checklist

### Smart Contracts
- [ ] AeosGenealogy compiled & tested
- [ ] AeosVestingStrategic includes genealogy integration
- [ ] Deploy to testnet
- [ ] Verify on testnet explorer
- [ ] Test referral bonus calculation
- [ ] Test admin management functions
- [ ] Deploy to mainnet

### Frontend
- [ ] Update `CONTRACTS.genealogy` address in config
- [ ] Verify hook compiles without errors
- [ ] Test Genealogy tab appears in Admin page
- [ ] Test "Check User" functionality
- [ ] Test "Manage Admins" functionality (as owner)
- [ ] Test "Update Affiliate" functionality (as admin)
- [ ] Test "Update Binary" functionality (as admin)
- [ ] Build production bundle: `npm run build`
- [ ] Deploy to hosting (GitHub Pages, Vercel, etc.)

### Testing
- [ ] Owner can add admin via UI
- [ ] Admin can update affiliate data
- [ ] Non-admin cannot update (verify error message)
- [ ] Referral bonus credited when registered user purchases
- [ ] Non-registered user's referral bonus skipped (no error)
- [ ] User can claim referral rewards
- [ ] Admin functions emit correct events
- [ ] Binary tree updates correctly

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `NOT_AUTHORIZED_ADMIN` | Caller is not owner/admin | Verify wallet is owner, or owner has added you as admin |
| `USER_NOT_FOUND` | Address not registered | Check address is correct & registered in genealogy |
| `ALREADY_ADMIN` | Address already is admin | Check admin list before adding |
| `NOT_ADMIN` | Trying to remove non-admin | Verify address is actually an admin |
| `ZERO_ADDRESS` | Passing address(0) | Enter valid address (0x...) |
| `NEW_PARENT_NOT_FOUND` | New parent not registered | New parent must exist in genealogy |
| `SELF_PARENT` | User trying to be their own parent | Select different parent address |

### UI Error Display

All errors are caught and displayed:
- Toast/alert shows error message
- Console logs full error details
- Transaction hash shown on success
- Automatic retry instructions provided

---

## Monitoring

### Events to Watch

```solidity
// AdminAdded(address indexed admin)
// AdminRemoved(address indexed admin)
// ReferralRewardCredited(address indexed sponsor, address indexed referrer, uint256 amount)
// ReferralRewardsClaimed(address indexed user, uint256 amount)
// AffiliateDataUpdated(address indexed user, address newParent)
// BinaryDataUpdated(address indexed user, address newParent, address newLeft, address newRight)
```

### Recommended Monitoring
- Track all `AdminAdded/Removed` events — Audit trail
- Track all `ReferralRewardCredited` events — Verify bonus distribution
- Track all `AffiliateDataUpdated` events — Detect unauthorized changes
- Monitor failed transactions — Identify common user errors

---

## Performance Notes

### Gas Costs
- `getAffiliate()` — ~5k gas (read-only)
- `addAdmin()` — ~50k gas (state change)
- `removeAdmin()` — ~50k gas (state change)
- `updateAffiliateData()` — ~100k gas (array manipulation)
- `updateBinaryData()` — ~50k gas (state change)

### Network Calls
- Read operations use RPC directly (fast)
- Write operations require wallet signature + mining
- Hook manages wallet client automatically

### Frontend Performance
- No loops or heavy computation
- All state updates are minimal
- Tab switching is instant
- Queries are optimized with proper caching

---

## Future Enhancements

Possible additions:
- [ ] Genealogy tree visualization
- [ ] Batch admin operations
- [ ] Affiliate search/filter
- [ ] Historical event logs viewer
- [ ] Referral rewards analytics dashboard
- [ ] Auto-migration tools for data corrections

---

## Support & Documentation

**Smart Contract SOP:**
`/references/sops/genealogy-smart-contract-integration.md`

**Hook Source:**
`/app/src/hooks/useAeosGenealogy.js`

**Component Source:**
`/app/src/pages/AdminGenealogy.jsx`

**Contract Source:**
`/hardhat/contracts/AeosGenealogy.sol`

---

## Summary

✅ **SOP Created** — Complete smart contract integration workflow  
✅ **Hook Implemented** — All genealogy queries & mutations  
✅ **UI Built** — 4-tab admin interface with full functionality  
✅ **Tests Ready** — Comprehensive testing checklist  
✅ **Monitoring** — Event tracking & error handling  

**Next Step:** Set contract addresses in config and deploy to testnet.
