# AEOS Vesting Frontend — Development Guide

**Phase 2: React 19 + Wagmi + Tailwind Dashboard**

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── pages/              # Full-page components (Dashboard, Strategic, Advisors, etc.)
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks (useWallet, useAeosVesting, etc.)
├── config/            # Configuration (Wagmi, contract ABIs, addresses)
├── styles/            # Global CSS & Tailwind utilities
├── utils/             # Helper functions (formatting, Web3 utils)
└── App.jsx            # Root component
```

---

## Tech Stack

- **React 19** — UI library with latest features
- **Vite 5** — Fast build tool with HMR
- **Wagmi v2** — Web3 React hooks for Ethereum/BSC
- **Viem** — Low-level Web3 utilities
- **TanStack Query** — Server state management (real-time data)
- **Tailwind CSS v4** — Utility-first styling with AEOS theme

---

## Key Components

### Navbar
- Wallet connection/disconnection
- Network indicator (Testnet/Mainnet)
- Navigation links

### Dashboard (Main Page)
- Quick stats (total allocated, released, claimable)
- Vesting modules grid
- Recent activity log

### Vesting Modules (Strategic, Advisors, Team)
- Module info & parameters
- Purchase form (Strategic/Advisors)
- Investment list with progress
- Admin configuration panels

### Claims
- Total claimable across all modules
- Claim/release interface
- Claim history
- Withdrawal period info

---

## Color Palette (AEOS Theme)

- **Gold:** `#FFB800` — Primary action, highlights
- **Dark:** `#0F1419` — Background
- **Card:** `#1A1F2E` — Card backgrounds
- **Text:** `#FFFFFF` — Primary text
- **Muted:** `#A0AEC0` — Secondary text
- **Success:** `#10B981` — Unlocked tokens
- **Warning:** `#F59E0B` — Pending/Cliff
- **Info:** `#8B5CF6` — Locked tokens

---

## Development Rules

1. **Use Tailwind for styling** — No CSS files except globals.css
2. **Use Wagmi hooks** — `useAccount`, `useContract`, `useContractRead`, `useContractWrite`
3. **Use React Query** — For server state (contract data)
4. **Component naming** — PascalCase for components, camelCase for files/folders
5. **State management** — Wagmi for Web3 state, React Query for server state
6. **Error handling** — Always handle blockchain errors (reverted tx, disconnected wallet, etc.)

---

## Contract Integration

### Available Hooks

```javascript
// Wallet connection
useAccount() → { address, isConnected, chainId }
useConnect() → { connect, connectors }
useDisconnect() → { disconnect }

// Contract reads
useContractRead(address, abi, functionName, options)

// Contract writes
useContractWrite(address, abi, functionName, options)
```

### Configuration

Contract ABIs and addresses are in `src/config/contracts.js`

Update these addresses after deploying smart contracts to BSC.

---

## Common Tasks

### Add New Page
1. Create file in `src/pages/NewPage.jsx`
2. Add route in App.jsx or use client-side routing
3. Add nav link in Navbar.jsx

### Add Custom Hook
1. Create file in `src/hooks/useMyHook.js`
2. Export from hook file
3. Use in components: `const result = useMyHook()`

### Query Contract Data
```javascript
import { useContractRead } from 'wagmi'
import { CONTRACTS } from '../config/contracts'

const { data, isLoading } = useContractRead({
  address: CONTRACTS.strategic,
  abi: ABI,
  functionName: 'getClaimableAmount',
  args: [userAddress, investmentIndex],
})
```

### Write to Contract
```javascript
import { useContractWrite } from 'wagmi'

const { write, isLoading } = useContractWrite({
  address: CONTRACTS.strategic,
  abi: ABI,
  functionName: 'releaseStrategicTokens',
  args: [investmentIndex],
})

// Call: write()
```

---

## Smart Contract Addresses (Update After Deployment)

```javascript
// src/config/contracts.js
CONTRACTS = {
  strategic: '', // AeosVestingStrategic
  advisors: '', // AeosVestingAdvisors
  team: '', // AeosVestingTeam
  reserves: '', // AeosVestingReserves
}
```

---

## Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel deploy

# Deploy to GitHub Pages
npm run build && git add dist && git commit -m "build: production build"
```

---

## Environment Variables

Create `.env.local`:
```
VITE_AEOS_ADDRESS=0x89417b107aD0eF0Ce0dA82c5d6fD6c81F6e0d25A
VITE_USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955
VITE_STRATEGIC_ADDRESS=0x...
VITE_ADVISORS_ADDRESS=0x...
```

---

## Debugging

### MetaMask Not Connecting
- Check browser console for errors
- Ensure MetaMask extension is installed
- Verify correct network (BSC Testnet/Mainnet)

### Contract Calls Failing
- Check contract ABI matches current contract code
- Verify contract addresses are correct
- Check wallet has sufficient balance for gas

### Real-time Data Not Updating
- Ensure React Query is configured
- Check block refresh interval in Wagmi config
- Verify contract read functions are called correctly

---

## Next Steps

1. ✅ Project setup
2. ⏭️ Implement Web3 hooks (useWallet, useAeosVesting, useVestingData)
3. ⏭️ Build vesting module pages
4. ⏭️ Add purchase forms
5. ⏭️ Implement claims interface
6. ⏭️ Test on BSC Testnet
7. ⏭️ Deploy to production
