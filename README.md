# AEOS Vesting — Institutional-Grade Token Vesting System

A comprehensive, multi-module token vesting platform for AEOS tokens on BSC supporting 8 allocation categories with owner-controlled distributions and public purchase mechanisms.

## 🎯 Overview

AEOS Vesting is a production-ready smart contract system + React frontend that manages token distribution across 8 distinct allocation categories, each with unique unlock schedules, access controls, and purchase mechanisms.

**Token Details:**
- **Token:** AEOS
- **Token CA:** `0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a`
- **Vesting Price:** 0.2 USDT per AEOS
- **Network:** BSC Mainnet (chainId 56)
- **Total Supply:** 1,000,000,000 AEOS

## 📊 Allocation Categories

| Category | Allocation | Amount | Vesting Model | Access |
|----------|-----------|--------|---------------|--------|
| Team & Founders | 10% | 100M AEOS | 18mo cliff, 2% monthly | Owner-assigned |
| Strategic Investors | 10% | 100M AEOS | 6mo cliff, 5% quarterly | Public purchase (min 10 USDT) |
| Advisors & Partnerships | 5% | 50M AEOS | 12mo cliff, 2.5% monthly | Public purchase (min 10 USDT) |
| Treasury Reserve | 25% | 250M AEOS | Locked (tracked) | Owner only |
| Liquidity & Market Making | 10% | 100M AEOS | 30% instant + 70% locked (5% quarterly) | Owner only |
| Community Incentives | 20% | 200M AEOS | Tracked balance | Owner only |
| Ecosystem Development | 15% | 150M AEOS | 10% instant + 10% yearly | Owner only |
| Community Growth | 5% | 50M AEOS | 5% instant + 5% quarterly | Owner only |

## ✨ Key Features

- **Multi-Module Architecture:** 8 independent vesting modules with specialized logic
- **Owner-Controlled Distributions:** Admin functions for team/founder assignments
- **Public Purchase Mechanism:** Public can purchase Strategic Investor & Advisor vesting (minimum 10 USDT)
- **Precise Unlock Schedules:** Cliff periods + monthly/quarterly releases with exact calculations
- **Balance Tracking:** Real-time tracking of locked allocations (treasury, liquidity, community)
- **Error Handling:** Comprehensive error messages on all frontend controls for debugging
- **Web3 Integration:** Full Wagmi + ethers.js integration with MetaMask support

## 🚀 Quick Start

### Frontend (React 19 + Vite)
```bash
cd app
npm install
npm run dev              # Dev server: http://localhost:5173
```

### Smart Contracts (Hardhat)
```bash
cd hardhat
npm install
npm run compile         # Compile Solidity contracts
npm run test           # Run all tests
npm run deploy         # Deploy to testnet
npm run deploy:bsc     # Deploy to mainnet
```

## 📁 Project Structure

```
aeos-vesting/
├── app/                             # React 19 + Vite + Wagmi frontend
│   ├── src/
│   │   ├── pages/                   # Full-page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Strategic.jsx
│   │   │   ├── Advisors.jsx
│   │   │   ├── Team.jsx
│   │   │   └── Claims.jsx
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── VestingCard.jsx
│   │   │   └── PurchaseForm.jsx
│   │   ├── hooks/                   # Web3 integration hooks
│   │   │   ├── useWallet.js
│   │   │   ├── useAeosVesting.js
│   │   │   └── useVestingData.js
│   │   ├── config/                  # Configuration files
│   │   │   ├── wagmi.js
│   │   │   └── contracts.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── CLAUDE.md
│   └── README.md
│
├── hardhat/                         # Hardhat smart contract environment
│   ├── contracts/                   # Solidity contracts
│   │   ├── AeosVesting.sol              # Main orchestrator
│   │   ├── AeosVestingTeam.sol          # Team & Founders
│   │   ├── AeosVestingStrategic.sol     # Strategic Investors
│   │   ├── AeosVestingAdvisors.sol      # Advisors & Partnerships
│   │   ├── AeosVestingReserves.sol      # Treasury & Tracking
│   │   ├── AeosLiquidityManager.sol     # Liquidity integration
│   │   ├── interfaces/
│   │   │   ├── IAEOS.sol
│   │   │   ├── IUSDT.sol
│   │   │   ├── ILiquidity.sol
│   │   │   ├── IPancakeV3Pool.sol
│   │   │   ├── INonfungiblePositionManager.sol
│   │   │   ├── ISwapRouter.sol
│   │   │   └── IVestingModule.sol
│   │   └── libraries/
│   │       ├── VestingMath.sol
│   │       ├── TickMath.sol
│   │       └── FullMath.sol
│   ├── test/                        # Test files
│   │   ├── AeosVesting.test.js
│   │   ├── AeosVestingTeam.test.js
│   │   ├── AeosVestingStrategic.test.js
│   │   └── AeosVestingAdvisors.test.js
│   ├── scripts/                     # Deployment & verification scripts
│   │   ├── deploy.js
│   │   └── verify.js
│   ├── artifacts/                   # Compiled contract ABIs
│   ├── cache/                       # Hardhat compilation cache
│   ├── node_modules/
│   ├── hardhat.config.js
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
│
├── sessions/                        # Development session tracking
├── CLAUDE.md                        # Development guide (root level)
├── README.md                        # This file
└── (Other root docs)
```

## 🔧 Technology Stack

**Smart Contracts (Hardhat/):**
- Solidity 0.8.24
- Hardhat 2.19+
- OpenZeppelin Contracts 4.9 (SafeERC20, Ownable)
- ethers.js v6
- BSC Network (Testnet: 97, Mainnet: 56)

**Frontend (App/):**
- React 19.0
- Vite 5.4+
- Tailwind CSS 4.0 (@tailwindcss/postcss)
- Wagmi v2.12+
- Viem v2.20+
- TanStack Query (React Query) v5.50+
- PostCSS 8.5+

## 📝 Development Phases

### Phase 1: Smart Contract Development
Implement all 8 vesting modules with owner/public access controls, cliff logic, and precise unlock calculations. ([See CLAUDE.md](CLAUDE.md))

### Phase 2: Testing & Deployment
Unit tests, integration tests, testnet deployment, and mainnet readiness. ([See CLAUDE.md](CLAUDE.md))

### Phase 3: Frontend Integration
React 19 app with Wagmi wallet integration, error handling on all controls, and responsive design. ([See CLAUDE.md](CLAUDE.md))

### Phase 4: Production Deployment
Smart contract verified on BSCScan, frontend live on GitHub Pages. ([See CLAUDE.md](CLAUDE.md))

## 🧪 Testing

Navigate to the hardhat folder to run tests:

```bash
cd hardhat

# Run all tests
npm run test

# Run specific test
npm run test -- test/AeosVestingTeam.test.js

# Run with coverage
npm run test -- --coverage
```

## 🚢 Deployment

Navigate to the hardhat folder for deployment:

```bash
cd hardhat

# Compile contracts
npm run compile

# Deploy to BSC Testnet (chainId 97)
npm run deploy -- --network bscTestnet

# Deploy to BSC Mainnet (chainId 56)
npm run deploy:bsc

# Verify contract on BSCScan
npm run verify -- <contract_address> --network bsc
```

## 📱 Frontend Development

Navigate to the app folder to develop the React frontend:

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev              # http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Documentation

**Project Docs:**
- **[CLAUDE.md](CLAUDE.md)** — Complete development guide, architecture, and implementation roadmap
- **[hardhat/README.md](hardhat/README.md)** — Smart contract development guide
- **[app/README.md](app/README.md)** — React frontend development guide

**External Docs:**
- **[Hardhat Docs](https://hardhat.org/)** — Smart contract build tool
- **[Wagmi v2](https://wagmi.sh/)** — Web3 React hooks
- **[Vite](https://vitejs.dev/)** — Frontend build tool
- **[Tailwind CSS](https://tailwindcss.com/)** — CSS framework
- **[OpenZeppelin](https://docs.openzeppelin.com/contracts/)** — Smart contract standards
- **[BSC Docs](https://docs.bnbchain.org/)** — Binance Smart Chain reference

## 🔐 Security

- Owner-only administrative functions (multi-sig recommended for mainnet)
- Access control checks on all sensitive operations
- Safe math operations via OpenZeppelin
- Contract verification on BSCScan

## 📞 Support

For development guidance, see **[CLAUDE.md](CLAUDE.md)** for the complete implementation roadmap.

---

## 📊 Project Status

**Phase 1: Smart Contracts** ✅ COMPLETE
- All 8 vesting modules implemented
- Contracts compiled successfully (26 files)
- Ready for testing and deployment

**Phase 2: Frontend** 🚀 IN PROGRESS
- React 19 + Vite setup complete
- Tailwind CSS v4 configured
- Wagmi integration ready
- Building Web3 hooks and pages

**Phase 3: Integration** ⏳ NEXT
- Wire frontend to smart contracts
- Test purchase flow
- Test claim/release functions

**Phase 4: Deployment** ⏳ FUTURE
- Deploy to BSC Testnet
- Contract verification
- Production deployment

---

**Network:** BSC (Testnet: 97, Mainnet: 56)  
**Latest Updates:** [View Sessions](sessions/)  
**Folder Structure:** [/hardhat](hardhat/) + [/app](app/) organization  
**Development Guides:** [CLAUDE.md](CLAUDE.md) | [hardhat/README.md](hardhat/README.md) | [app/README.md](app/README.md)
