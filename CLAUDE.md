# CLAUDE.md — AEOS Vesting Development Guide

**Institutional-Grade Token Vesting System for AEOS Token**

---

## 🎯 Project Overview

Build a comprehensive, multi-module token vesting system for AEOS (Token CA: `0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a`) supporting 8 distinct allocation categories with varying unlock schedules, access controls, and purchase mechanisms.

**Token Details:**
- Token: AEOS
- Token CA: `0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a`
- Vesting Price: 0.2 USDT
- Liquidity Pool: `0xd6be48c33a7284448d92f4b9638ddf3286360f8b` (PancakeSwap V3)
- Total Supply: 1,000,000,000 AEOS

---

## 📋 AEOS Allocation Breakdown

| Module | Allocation | Total AEOS | Vesting Model | Access |
|--------|-----------|-----------|---------------|--------|
| Team & Founders | 10% | 100,000,000 | 18mo cliff, 2% monthly | Owner only |
| Strategic Investors | 10% | 100,000,000 | 6mo cliff, 5% quarterly | Public (min 10 USDT) |
| Advisors & Partnerships | 5% | 50,000,000 | 12mo cliff, 2.5% monthly | Public (min 10 USDT) |
| Treasury Reserve | 25% | 250,000,000 | Locked (tracked) | Owner only |
| Liquidity & Market Making | 10% | 100,000,000 | 30% instant, 70% locked, 5% quarterly | Owner only |
| Community Incentives | 20% | 200,000,000 | Tracked balance | Owner only |
| Ecosystem Development | 15% | 150,000,000 | 10% instant (15M), 10% yearly | Owner only |
| Community Growth | 5% | 50,000,000 | 5% instant (2.5M), 5% quarterly | Owner only |

---

## 🏗️ Development Phases

### Phase 0: Genealogy Integration ✅ **COMPLETE**
**Status:** Smart contract deployed, frontend wired, admin UI functional, SOP documented

**Deliverables Completed:**
- ✅ AeosGenealogy.sol — Dual-tree (referral + binary) contract with gas optimization
- ✅ Gas buffer checks (gasleft()) with dynamic per-user depth adjustment
- ✅ Admin management system (owner + designated admins)
- ✅ useAeosGenealogy.js hook — Read/write functions with error handling
- ✅ AdminGenealogy.jsx — 4-tab UI (Check User, Manage Admins, Update Affiliate, Update Binary)
- ✅ Frontend routing (/admin/genealogy) + navbar integration
- ✅ Deployment automation (deploy.js)
- ✅ SOP documentation (genealogy-smart-contract-integration.md)

**Deployed Addresses (Hardhat localhost):**
- Genealogy: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
- Strategic (integrated): 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f

**How to Test:**
1. Keep Hardhat node running: `npx hardhat node`
2. Deploy contracts: `npx hardhat run scripts/deploy.js --network localhost`
3. Start React app: `npm run dev` (runs at http://localhost:5176)
4. Connect wallet → Admin → Genealogy

---

### Phase 1: Smart Contract Development
**Invoke:** `/Users/admin/Projects/ExecutiveAssistant/.claude/skills/blockchain-skills-external/skills/solidity/SKILL.md`

**Deliverables:**
- 8 vesting modules (contracts or single contract with module system)
- Owner-only administrative functions
- Public purchase interface for Strategic Investors & Advisors
- Cliff-and-release mechanics with precise unlock schedules
- Balance tracking for locked allocations
- Comprehensive events for all state changes

**Key Files:**
```
contracts/
├── AeosVesting.sol           # Main multi-module vesting contract
├── AeosVestingTeam.sol       # Team & Founders module (owner-assigned)
├── AeosVestingStrategic.sol  # Strategic Investors module (public purchase)
├── AeosVestingAdvisors.sol   # Advisors module (public purchase)
├── AeosVestingReserves.sol   # Treasury, Liquidity, Community tracking
├── interfaces/
│   ├── IAEOS.sol             # AEOS token interface (ERC20)
│   └── IVestingModule.sol    # Common vesting interface
└── libraries/
    └── VestingMath.sol       # Unlock calculations
```

### Phase 2: Testing & Deployment Readiness
**Hardhat + BSC Testnet/Mainnet Deployment**

**Commands:**
```bash
npm run compile                              # Compile all contracts
npm run test                                 # Run all unit tests
npm run deploy -- --network bscTestnet       # Deploy to BSC Testnet
npm run deploy:bsc                           # Deploy to BSC Mainnet
npm run verify -- <contract_address> --network bsc  # Verify on BSCScan
```

**Testing Checklist:**
- [ ] Unit tests for each vesting module
- [ ] Cliff logic tests (timestamps, edge cases)
- [ ] Owner access control tests
- [ ] Public purchase mechanism tests (min USDT, multiple deposits)
- [ ] Balance tracking tests
- [ ] Release calculation tests (monthly, quarterly, yearly)
- [ ] Integration tests (all modules together)

### Phase 3: Frontend Development
**React 19 + Vite + Tailwind CSS + Wagmi**

**Deliverables:**
- Dashboard showing all vesting allocations
- Module-specific interfaces:
  - Team/Founders: Owner distribution panel
  - Strategic/Advisors: Public purchase UI (with USDT payment)
  - Reserves/Tracking: Balance view for each wallet
- Real-time unlock schedule visualization
- Withdrawal mechanisms with cooldown enforcement
- Error handling on all button controls (console + UI display)

**Tech Stack (Latest Versions):**
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^5.4.0",
    "tailwindcss": "^4.0.0",
    "wagmi": "^2.12.0",
    "viem": "^2.20.0",
    "@tanstack/react-query": "^5.50.0",
    "lucide-react": "^0.408.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

**Key Pages:**
```
src/
├── pages/
│   ├── Dashboard.jsx              # Overview of all allocations
│   ├── TeamFounders.jsx           # Owner distribution
│   ├── StrategicInvestors.jsx     # Public purchase interface
│   ├── Advisors.jsx               # Public purchase interface
│   ├── Reserves.jsx               # Treasury, Liquidity tracking
│   └── Withdrawals.jsx            # Claim unlocked tokens
├── components/
│   ├── VestingSchedule.jsx        # Timeline visualization
│   ├── UnlockChart.jsx            # Progress/unlock graphs
│   ├── PurchaseForm.jsx           # USDT payment interface
│   └── ErrorDisplay.jsx           # Error toast/modal for debugging
├── hooks/
│   ├── useVestingContract.js      # Contract interaction
│   ├── useUserVesting.js          # User-specific data
│   └── useAllocation.js           # Per-module state
└── config/
    ├── wagmi.js                   # Wagmi + BSC config
    └── contracts.js               # ABI + addresses
```

### Phase 4: Production Deployment
**GitHub Pages + BSC Mainnet**

**Deployment:**
```bash
# Smart Contract: Deploy to BSC Mainnet
npm run deploy:bsc

# Frontend: Build & deploy to GitHub Pages
npm run build
npm run deploy-gh-pages
```

**Verification:**
- [ ] Contract verified on BSCScan
- [ ] Frontend live on GitHub Pages
- [ ] Wallet integration tested
- [ ] All vesting modules functional
- [ ] Error handling working (console logs visible)

---

## 🔧 Stack & Compatibility

### Smart Contract Layer
- **Solidity:** 0.8.24
- **Hardhat:** ^2.19.0
- **OpenZeppelin:** ^5.0.0
- **Network:** BSC Mainnet (chainId 56)

### Frontend Layer
- **React:** ^19.0.0 (latest)
- **Vite:** ^5.4.0 (latest, with HMR)
- **Tailwind CSS:** ^4.0.0 (latest with @apply improvements)
- **Wagmi:** ^2.12.0 (latest, supports BSC auto-switching)
- **Viem:** ^2.20.0 (pairs with Wagmi 2)
- **React Query:** ^5.50.0 (caching contract reads)

### Compatibility Notes
- Wagmi 2.x requires viem 2.x (bundled)
- React 19 compatible with all listed packages
- Tailwind CSS 4 uses PostCSS 8+ (auto-installed)
- All packages are ESM-first and Vite-optimized

---

## 🧩 Contract Architecture

### Module System

**Core Contract:** `AeosVesting.sol`
- Ownership management (Ownable)
- AEOS token reference (ERC20)
- USDT interface for public purchases
- Module registry & routing
- Event emissions for all state changes

**Module Interfaces:**
```solidity
interface IVestingModule {
  function beneficiary() external view returns (address);
  function totalAllocated() external view returns (uint256);
  function releasedAmount() external view returns (uint256);
  function unlockedAmount() external view returns (uint256);
  function cliffEnd() external view returns (uint256);
  function vestingEnd() external view returns (uint256);
  function getUnlockableAmount(address user) external view returns (uint256);
  function release(address user) external;
}
```

### Key Functions by Module

**Team & Founders (Owner-Only):**
- `assignTeamMember(address, uint256 amount)` — Owner assigns vesting to team member
- `depositTeamTokens(uint256 amount)` — Owner deposits tokens to module
- `releaseTeamTokens(address member)` — Team member claims unlocked tokens
- `setTeamClifPeriod(uint256 months)` — Owner sets cliff (18 months)
- `setTeamUnlockRate(uint256 percentMonthly)` — Owner sets unlock (2% monthly)

**Strategic Investors (Public):**
- `buyStrategicVesting(uint256 usdtAmount)` — Public buys vesting (min 10 USDT = 50 AEOS @ 0.2)
- `getStrategicUnlockable(address investor)` — Check releasable amount
- `releaseStrategicTokens()` — Investor claims unlocked tokens (5% per quarter)
- `setMinimumInvestment(uint256 usdtAmount)` — Owner sets min purchase

**Advisors (Public):**
- `buyAdvisorVesting(uint256 usdtAmount)` — Public buys vesting
- `getAdvisorUnlockable(address advisor)` — Check releasable amount
- `releaseAdvisorTokens()` — Advisor claims tokens (2.5% monthly)

**Tracking Modules (Read-Only):**
- `getTreasuryBalance()` — Check treasury wallet balance
- `getLiquidityBalance()` — Check liquidity pool balance
- `getCommunityBalance()` — Check community incentive balance
- `getEcosystemBalance()` — Check ecosystem dev balance
- `getCommunityGrowthBalance()` — Check community growth balance

### Events

```solidity
event TeamVestingAssigned(address indexed member, uint256 amount, uint256 cliffEnd);
event StrategicVestingPurchased(address indexed buyer, uint256 usdtAmount, uint256 aeosAmount);
event AdvisorVestingPurchased(address indexed advisor, uint256 usdtAmount, uint256 aeosAmount);
event TokensReleased(address indexed beneficiary, uint256 amount, string module);
event ClifPeriodUpdated(uint256 newCliffMonths, string module);
event UnlockRateUpdated(uint256 newRate, string module);
```

---

## 🔐 Access Control

| Function | Team/Founders | Strategic | Advisors | Reserves | Admin |
|----------|---------------|-----------|----------|----------|-------|
| Assign vesting | Owner only | - | - | - | Owner |
| Deposit tokens | Owner | - | - | Owner | Owner |
| Buy vesting | - | Public (min 10 USDT) | Public (min 10 USDT) | - | - |
| Claim tokens | Team member | Investor | Advisor | - | - |
| Set parameters | Owner | Owner | Owner | Owner | Owner |
| View balances | Public | Public | Public | Public | Public |

---

## 🚀 Setup & Commands

```bash
# Install dependencies
npm install

# Compile Solidity contracts
npm run compile

# Run tests (Hardhat)
npm run test

# Deploy to BSC Testnet
npm run deploy -- --network bscTestnet

# Deploy to BSC Mainnet
npm run deploy:bsc

# Verify on BSCScan
npm run verify -- <address> --network bsc

# Frontend development
cd frontend
npm install
npm run dev

# Frontend build & deploy
npm run build
npm run deploy-gh-pages
```

---

## 📐 Unlock Schedules Reference

**Team & Founders:**
- Cliff: 18 months
- Release: 2% monthly (after cliff)
- Duration: 60 months total

**Strategic Investors:**
- Cliff: 6 months
- Release: 5% quarterly
- Duration: 5 years (60 months)

**Advisors & Partnerships:**
- Cliff: 12 months
- Release: 2.5% monthly
- Duration: 4 years (48 months)

**Liquidity & Market Making:**
- Initial: 30% (released immediately)
- Locked: 70%
- Release: 5% quarterly over remaining 28 months

**Ecosystem Development:**
- Initial: 10% (15,000,000 AEOS, released immediately)
- Release: 10% yearly for remaining 9 years

**Community Growth:**
- Initial: 5% (2,500,000 AEOS, released immediately)
- Release: 5% quarterly for remaining 3.75 years

---

## 📝 Error Handling

**Frontend Error Display:**
- All button clicks wrap async calls in try/catch
- Errors displayed as toast/modal with full error message
- Console logs include:
  - Function name
  - Parameters passed
  - Error message & stack trace
  - Transaction hash (if applicable)

**Example Implementation:**
```jsx
const handleRelease = async () => {
  try {
    console.log(`Releasing tokens for module: ${moduleName}`)
    const tx = await contract.release(userAddress)
    console.log(`Transaction hash: ${tx.hash}`)
    const receipt = await tx.wait()
    console.log(`Released successfully: ${receipt}`)
  } catch (error) {
    console.error(`Error releasing tokens:`, error)
    showError(`Failed to release tokens: ${error.message}`)
  }
}
```

---

## ✅ Deployment Checklist

### Smart Contract
- [ ] All modules compile without warnings
- [ ] Unit tests pass (100% coverage)
- [ ] Integration tests pass
- [ ] Gas optimization reviewed
- [ ] Security audit completed (if required)
- [ ] Deployed to BSC Testnet
- [ ] All functions tested on testnet
- [ ] Contract verified on BSCScan
- [ ] Deployed to BSC Mainnet
- [ ] Mainnet addresses documented

### Frontend
- [ ] React 19 app builds without errors
- [ ] Wagmi connected to BSC mainnet
- [ ] All vesting modules integrated
- [ ] Error handling tested
- [ ] Mobile responsive design verified
- [ ] Built and deployed to GitHub Pages
- [ ] Live URL accessible
- [ ] Wallet integration functional

---

## 📚 References

- [AEOS Token](https://bscscan.com/token/0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi v2 Docs](https://wagmi.sh/)
- [BSC Documentation](https://docs.bnbchain.org/)
- [PancakeSwap Liquidity Pool](https://pancakeswap.finance/)
- [BSCScan Verification](https://bscscan.com/)

---

## 🎯 Success Criteria

✅ **Phase 0:** Genealogy integration complete (contract + frontend + admin UI)  
⏳ **Phase 1:** All 8 vesting modules fully implemented with owner/public access controls  
⏳ **Phase 2:** Tests passing, testnet deployment verified  
⏳ **Phase 3:** Frontend integrates with deployed contract, all buttons functional with error handling  
⏳ **Phase 4:** Live on GitHub Pages + BSC Mainnet with verified contract
