# Deployment Script Updates Summary

**Updated deployment script to align with contract changes**

---

## Changes Made

### 1. **Added AeosGenealogy Deployment**
**File:** `hardhat/scripts/deploy.js` (Lines 80-88)

```javascript
// Deploy genealogy contract first (needed for referral system)
const Genealogy = await hre.ethers.getContractFactory("AeosGenealogy");
const genealogyModule = await Genealogy.deploy(deployer.address);
await genealogyModule.waitForDeployment();
const genealogyAddr = await genealogyModule.getAddress();
```

**Purpose:** Genealogy is now deployed first because Strategic Vesting depends on it.

**Parameters:**
- `deployer.address` = Root user (can register other users)

**Output:**
```
✅ AeosGenealogy deployed to: 0x...
   └─ Root user: 0xDeployer
```

---

### 2. **Updated AeosVestingStrategic Deployment**
**File:** `hardhat/scripts/deploy.js` (Lines 100-105)

**Before:**
```javascript
const strategicModule = await StrategicVesting.deploy(aeosAddress, usdtAddress);
```

**After:**
```javascript
const strategicModule = await StrategicVesting.deploy(aeosAddress, usdtAddress, genealogyAddr);
```

**New Parameter:** `genealogyAddr` - Enables referral system (10% AEOS bonus)

**Why:** Strategic Vesting uses genealogy to:
- Check if user is registered
- Get sponsor address
- Credit referral bonus to sponsor

---

### 3. **Enhanced Deployment JSON Output**
**File:** `hardhat/scripts/deploy.js` (Lines 131-159)

**New Fields:**
```json
{
  "contracts": {
    "genealogy": "0x...",  // NEW
    "team": "0x...",
    "strategic": "0x...",
    "advisors": "0x...",
    "reserves": "0x..."
  },
  "wallets": {
    "deployer": "0x...",  // NEW - for reference
    ...
  },
  "configuration": {  // NEW section
    "genealogyRoot": "0x...",
    "strategicGenealogy": "0x...",
    "notes": "Genealogy enables referral system..."
  }
}
```

**Purpose:** Records genealogy address for later reference and includes configuration notes.

---

### 4. **Updated Console Output**
**File:** `hardhat/scripts/deploy.js` (Lines 124-200)

**New Output Format:**
```
🏗️ Deploying Genealogy contract...
✅ AeosGenealogy deployed to: 0x...
   └─ Root user: 0x...

🏗️ Deploying vesting modules...
✅ Strategic Investors deployed to: 0x...
   └─ Genealogy integration: 0x...

📦 Contract Addresses:
  Genealogy: 0x...
  Team & Founders: 0x...
  Strategic Investors: 0x...
  Advisors & Partnerships: 0x...
  Reserves: 0x...

✨ Deployment complete! Next steps:
   1. REQUIRED: Update frontend config
      - Set: genealogy: '0x...'
      - Set: strategic: '0x...'
   2. OPTIONAL: Register root user
   3. Fund contracts with AEOS
   4. Configure module parameters
   5. Verify contracts on BSCScan
   6. Deploy frontend
```

---

## Deployment Order (After Update)

```
1. Mock Tokens
   ├─ USDT (for testing)
   └─ AEOS (for testing)

2. Genealogy ✅ NEW
   └─ Root: deployer

3. Vesting Modules
   ├─ Team (AEOS only)
   ├─ Strategic (AEOS, USDT, Genealogy) ✅ UPDATED
   ├─ Advisors (AEOS, USDT)
   └─ Reserves (wallet addresses)
```

---

## Contract Constructor Parameters

### After Deployment

| Contract | Parameters | Notes |
|----------|-----------|-------|
| AeosGenealogy | `_root: deployer` | Root can register users |
| AeosVestingTeam | `_aeosToken: address` | Simple AEOS-only |
| AeosVestingStrategic | `_aeosToken, _usdtToken, _genealogy` | ✅ Genealogy now required |
| AeosVestingAdvisors | `_aeosToken, _usdtToken` | USDT-based purchases |
| AeosVestingReserves | `_liquidity, _incentives, _ecosystem, _growth` | Wallet addresses |

---

## Deployment JSON Structure

**File:** `deployments/deployment-latest.json` (saved after each deployment)

```json
{
  "network": "bscTestnet",
  "timestamp": "2026-06-12T14:30:00.000Z",
  "contracts": {
    "genealogy": "0x...",
    "team": "0x...",
    "strategic": "0x...",
    "advisors": "0x...",
    "reserves": "0x..."
  },
  "tokens": {
    "aeos": "0x...",
    "usdt": "0x..."
  },
  "wallets": {
    "deployer": "0x...",
    "treasury": "0x...",
    "liquidity": "0x...",
    "communityIncentives": "0x...",
    "ecosystem": "0x...",
    "communityGrowth": "0x..."
  },
  "configuration": {
    "genealogyRoot": "0x...",
    "strategicGenealogy": "0x...",
    "notes": "Genealogy enables referral system (10% AEOS bonus)..."
  }
}
```

---

## Frontend Configuration Update

After deployment, update frontend config:

**File:** `app/src/config/contracts.js`

```javascript
export const CONTRACTS = {
  genealogy: '0x...copy_from_deployment_json...',  // ✅ NEW
  team: '0x...',
  strategic: '0x...',
  advisors: '0x...',
  reserves: '0x...',
}

export const TOKENS = {
  aeos: '0x...from_deployment_json...',
  usdt: '0x...from_deployment_json...',
}
```

---

## Verification Checklist

### Smart Contract Deployment
- [ ] All contracts deployed successfully
- [ ] Genealogy address recorded
- [ ] Strategic has genealogy address linked
- [ ] Deployment JSON created in `deployments/` folder
- [ ] All contract addresses match frontend config

### Genealogy Integration
- [ ] `genealogyAddr` passed to Strategic constructor
- [ ] Root user is deployer
- [ ] Genealogy contract can be called independently

### Post-Deployment
- [ ] Fund contracts with AEOS
- [ ] Update frontend with contract addresses
- [ ] Test referral system (registered user → sponsor gets 10%)
- [ ] Test genealogy admin functions (add/remove admins)
- [ ] Verify on BSCScan

---

## Important Differences from Previous Deployment

| Aspect | Before | After |
|--------|--------|-------|
| Genealogy | ❌ Not deployed | ✅ Deployed first |
| Strategic Constructor | 2 params (AEOS, USDT) | 3 params (AEOS, USDT, Genealogy) |
| Referral System | ❌ Not available | ✅ Available |
| Deployment JSON | Missing genealogy | ✅ Includes genealogy |
| Post-Deployment Notes | Minimal | ✅ Detailed next steps |
| Frontend Config Required | Just vesting modules | ✅ Includes genealogy address |

---

## Running the Updated Script

### Testnet Deployment
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Mainnet Deployment
```bash
npx hardhat run scripts/deploy.js --network bsc
```

### Expected Output
```
🚀 Deploying AEOS Vesting System...
📌 Deploying with account: 0x...

🏗️ Deploying Genealogy contract...
✅ AeosGenealogy deployed to: 0x...

🏗️ Deploying vesting modules...
✅ Team & Founders deployed to: 0x...
✅ Strategic Investors deployed to: 0x...
✅ Advisors & Partnerships deployed to: 0x...
✅ Reserves deployed to: 0x...

✨ Deployment complete! Next steps:
   1. REQUIRED: Update frontend config
      - genealogy: '0x...'
      - strategic: '0x...'
   ...
```

---

## Files Updated

- ✅ `hardhat/scripts/deploy.js` — Complete deployment flow with genealogy
- ✅ `DEPLOYMENT_CHECKLIST.md` — Comprehensive post-deployment guide
- ✅ `DEPLOYMENT_UPDATES.md` — This file (summary of changes)

---

## Summary

✅ **Genealogy now part of deployment flow**  
✅ **Strategic Vesting integrated with genealogy**  
✅ **Referral system ready to use after deployment**  
✅ **Frontend config includes genealogy address**  
✅ **Post-deployment checklist provided**  

**Next Step:** Run deployment script and update frontend config with genealogy address from output.
