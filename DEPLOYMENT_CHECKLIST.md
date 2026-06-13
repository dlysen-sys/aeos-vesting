# Deployment Checklist & Post-Deployment Configuration

**Complete deployment workflow for AEOS Vesting System**

---

## Phase 1: Smart Contract Deployment

### Prerequisites
- [ ] Node.js v18+ and npm installed
- [ ] Hardhat project compiled: `npm run compile`
- [ ] Private key configured in `.env` or HardHat config
- [ ] Test network setup (BSC Testnet or similar)

### Deployment Script Execution

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Deploy to mainnet (CAREFUL!)
npx hardhat run scripts/deploy.js --network bsc
```

**Script deploys in this order:**
1. ✅ Mock tokens (USDT, AEOS) for testing
2. ✅ AeosGenealogy (root = deployer)
3. ✅ AeosVestingTeam (AEOS only)
4. ✅ AeosVestingStrategic (AEOS, USDT, Genealogy)
5. ✅ AeosVestingAdvisors (AEOS, USDT)
6. ✅ AeosVestingReserves (wallet addresses)

**Output saved to:**
- `deployments/deployment-latest.json` (current)
- `deployments/deployment-<network>-<timestamp>.json` (archive)

---

## Phase 2: Contract Configuration

### Step 1: Record Contract Addresses

After deployment, note these addresses:

```json
{
  "genealogy": "0x...",
  "team": "0x...",
  "strategic": "0x...",
  "advisors": "0x...",
  "reserves": "0x...",
  "aeos": "0x...",
  "usdt": "0x..."
}
```

### Step 2: Update Frontend Configuration

**File:** `app/src/config/contracts.js`

```javascript
export const CONTRACTS = {
  genealogy: '0x...genealogy_address...',  // NEW
  team: '0x...team_address...',
  strategic: '0x...strategic_address...',
  advisors: '0x...advisors_address...',
  reserves: '0x...reserves_address...',
}

export const TOKENS = {
  aeos: '0x...aeos_token...',
  usdt: '0x...usdt_token...',
}
```

### Step 3: Fund Contracts with AEOS

Each vesting module needs AEOS tokens to distribute:

```bash
# Option 1: From command line (using hardhat)
npx hardhat run scripts/fund-contracts.js --network <network>

# Option 2: Manual via Etherscan/BlockScout
# 1. Approve contract address for amount
# 2. Call depositStrategicTokens(amount) / depositAdvisorsTokens(amount) / etc.
```

**Recommended initial funding:**
- Strategic: 50,000,000 AEOS
- Advisors: 25,000,000 AEOS
- Team: 100,000,000 AEOS
- Reserves: (tracked, no deposit needed)

---

## Phase 3: Module-Specific Configuration

### AeosGenealogy Setup

```solidity
// 1. Root user is deployer (automatic)
// 2. Register root as user if needed (optional)
// 3. Add admins for migration tasks (as owner)

addAdmin(0xAdminAddress)
```

**Genealogy doesn't need configuration** — it's ready to use immediately.

### AeosVestingStrategic Setup

```solidity
// 1. Set Treasury Wallet (optional, defaults to deployer)
setTreasuryWallet(0xTreasuryAddress)

// 2. Set Liquidity Contract (optional, for LP routing)
setLiquidityContract(0xLiquidityPoolAddress)

// 3. Configure vesting parameters (optional, can change anytime)
setVestingConfiguration(
  newVestingPrice,      // 0.2 * 1e18
  newMinInvestment,     // 10 * 1e18
  newCliffMonths,       // 6
  newUnlockPercent,     // 500 (5%)
  newVestingMonths,     // 60
  newWithdrawalPeriod   // 90 days
)

// 4. Configure tiered pricing (optional)
setTier1Pricing(100e18, 0.30e18)
setTier2Pricing(500e18, 0.28e18)
setTier3Pricing(2000e18, 0.24e18)
setTier4Price(0.20e18)

// 5. Deposit AEOS tokens (REQUIRED for users to claim)
depositStrategicTokens(amount)
```

### AeosVestingAdvisors Setup

```solidity
// 1. Set Treasury Wallet (optional)
setTreasuryWallet(0xTreasuryAddress)

// 2. Set Liquidity Contract (optional)
setLiquidityContract(0xLiquidityPoolAddress)

// 3. Configure vesting (optional)
setVestingConfiguration(...)

// 4. Deposit AEOS (REQUIRED)
depositAdvisorsTokens(amount)
```

### AeosVestingTeam Setup

```solidity
// 1. Assign team members (owner only)
assignTeamMember(0xTeamMemberAddress, amountInWei)

// 2. Deposit AEOS (REQUIRED before claims)
depositTeamTokens(amount)
```

### AeosVestingReserves Setup

```solidity
// Reserves are read-only tracking
// Wallets are set at deployment
// No additional configuration needed
```

---

## Phase 4: Verification & Testing

### On-Chain Verification

```bash
# Verify on BSCScan
npx hardhat verify --network bsc 0xContractAddress "Constructor","Args","Here"

# Example:
npx hardhat verify --network bsc 0x... "0xAEOS_Address" "0xUSDT_Address" "0xGenealogy_Address"
```

### Local Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/AeosVestingStrategic.test.js

# Coverage report
npm run coverage
```

### Functional Testing Checklist

- [ ] **User Registration** (Genealogy)
  - Register user with sponsor
  - Verify affiliate structure
  - Check binary placement

- [ ] **Referral System** (Strategic)
  - Registered user purchases → sponsor gets 10% bonus
  - Non-registered user purchases → no bonus (no error)
  - User can claim referral rewards

- [ ] **Vesting** (Strategic/Advisors)
  - Purchase vesting at correct tier price
  - AEOS allocated but not claimable before cliff
  - After cliff, can claim quarterly
  - Release history accurate

- [ ] **Team Vesting**
  - Owner assigns team members
  - Team members can claim after cliff
  - Vesting schedule correct

- [ ] **Admin Functions** (Genealogy)
  - Owner can add/remove admins
  - Admins can update affiliate data
  - Non-admins cannot modify genealogy

---

## Phase 5: Frontend Deployment

### Build

```bash
cd app
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy-gh-pages
```

### Deploy to Vercel

```bash
vercel deploy --prod
```

### Post-Deployment Frontend Checks

- [ ] Contract addresses loaded correctly
- [ ] Wallet connection works
- [ ] Dashboard displays correct balances
- [ ] Purchase forms submit transactions
- [ ] Claims calculate correctly
- [ ] Genealogy admin tab functional
- [ ] Error messages display properly

---

## Phase 6: Mainnet Preparation

### Before Mainnet Deployment

- [ ] All smart contracts audited (if required)
- [ ] All contracts verified on explorer
- [ ] All tests passing (100% coverage ideally)
- [ ] Frontend tested thoroughly on testnet
- [ ] All wallets/addresses confirmed
- [ ] Liquidity contract address obtained (if using)
- [ ] Team/advisor/ecosystem addresses confirmed
- [ ] Treasury wallet address confirmed
- [ ] Initial AEOS funding amount approved

### Mainnet Deployment Steps

1. **Deploy to mainnet:**
   ```bash
   npx hardhat run scripts/deploy.js --network bsc
   ```

2. **Fund contracts:**
   ```bash
   npx hardhat run scripts/fund-contracts.js --network bsc
   ```

3. **Verify contracts:**
   ```bash
   npx hardhat verify --network bsc 0xAddress "Args"
   ```

4. **Deploy frontend to production**

5. **Announce to users** (with documentation)

---

## Important Notes

### Security Reminders

⚠️ **Private Key Safety**
- Never commit `.env` with private keys
- Use environment variables or hardware wallets
- For mainnet, use multi-sig if possible

⚠️ **Contract Ownership**
- Consider transferring ownership to multi-sig
- Implement timelock for admin changes
- Document owner recovery process

⚠️ **Fund Management**
- Start with small initial funding
- Gradually increase after testing
- Monitor contract balances regularly

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Deployment fails | Check compiler version, contract syntax, network connection |
| Contract verification fails | Ensure exact constructor args match deployment |
| Transactions revert | Check allowances, balances, gas, contract state |
| Users can't claim | Verify AEOS has been deposited to contract |
| Genealogy not tracking | Verify genealogy address passed to Strategic |

---

## Monitoring Post-Deployment

### Key Metrics to Watch

```javascript
// Daily checks
- AEOS balance in each contract
- Total claims processed
- Referral bonuses distributed
- Number of active users
- Failed transaction count

// Weekly checks
- Genealogy tree health
- Vesting schedule accuracy
- Income distribution
- User complaints/errors
```

### Event Monitoring

All important actions emit events — monitor these:
- `StrategicVestingPurchased` — New purchases
- `StrategicTokensReleased` — Claims processed
- `ReferralRewardCredited` — Bonuses distributed
- `AdminAdded/Removed` — Admin changes
- `AffiliateDataUpdated` — Genealogy changes

---

## Rollback Procedures

If critical issues found:

1. **Pause operations** (if Pausable modifier added)
2. **Deploy patch** to new contract
3. **Migrate users** to new contract
4. **Communicate status** to users

---

## Support Contacts

- **Smart Contract Issues:** Check logs, verify on explorer, run tests
- **Frontend Issues:** Check browser console, verify RPC connection
- **User Support:** Monitor transaction history, verify balances

---

## Summary Checklist

- [ ] Phase 1: Deploy smart contracts ✅
- [ ] Phase 2: Update frontend config ✅
- [ ] Phase 3: Configure modules ✅
- [ ] Phase 4: Run verification & tests ✅
- [ ] Phase 5: Deploy frontend ✅
- [ ] Phase 6: Prepare for mainnet ✅

**Status:** Ready for production when all phases complete! 🚀
