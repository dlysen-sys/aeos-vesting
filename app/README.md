# AEOS Vesting — React 19 Frontend

Modern React 19 + Vite dashboard for the AEOS token vesting system with MetaMask wallet integration and Tailwind CSS styling.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev              # http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── pages/               # Full-page components
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks (useWallet, useAeosVesting, useVestingData)
├── config/             # Configuration (wagmi.js, contracts.js)
├── styles/             # Global CSS with Tailwind utilities
├── utils/              # Helper functions (format.js, web3.js)
├── App.jsx             # Root component
└── main.jsx            # Vite entry point
```

## 🎨 Tech Stack

- **React 19** — Latest React with automatic batching
- **Vite 5** — Lightning-fast build tool with HMR
- **Tailwind CSS 4** — Utility-first CSS framework (@tailwindcss/postcss)
- **Wagmi v2** — React hooks for Web3
- **Viem v2** — Lightweight Web3 utilities
- **TanStack Query 5** — Server state management

## 🔗 Web3 Integration

**Wallet:** MetaMask via Wagmi  
**Network:** BNB Smart Chain (BSC)  
**Contracts:** AeosVesting Smart Contracts

### Environment Setup

Update contract addresses in `src/config/contracts.js`:

```javascript
CONTRACTS = {
  strategic: '0x...',  // AeosVestingStrategic
  advisors: '0x...',   // AeosVestingAdvisors
  team: '0x...',       // AeosVestingTeam
  reserves: '0x...',   // AeosVestingReserves
}
```

## 🎯 Key Features

- ✅ MetaMask wallet connection
- ✅ Real-time vesting data display
- ✅ USDT purchase forms (Strategic & Advisors)
- ✅ Token claim/release interface
- ✅ Admin configuration panels
- ✅ Dark theme with AEOS color palette
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Error handling with console logs + UI messages

## 📖 Documentation

- **[../CLAUDE.md](../CLAUDE.md)** — Complete development guide
- **[../hardhat/README.md](../hardhat/README.md)** — Smart contract documentation
- **[Wagmi v2 Docs](https://wagmi.sh/)** — Web3 React hooks
- **[Tailwind CSS](https://tailwindcss.com/)** — CSS framework
- **[Vite Docs](https://vitejs.dev/)** — Build tool

## 🛠️ Development

### Add New Page
1. Create component in `src/pages/`
2. Import in `src/App.jsx`
3. Add navigation link in Navbar

### Query Smart Contract
```javascript
const { data } = useContractRead({
  address: CONTRACTS.strategic,
  abi: STRATEGIC_ABI,
  functionName: 'getClaimableAmount',
  args: [userAddress, investmentIndex],
})
```

### Interact with Smart Contract
```javascript
const { write } = useContractWrite({
  address: CONTRACTS.strategic,
  abi: STRATEGIC_ABI,
  functionName: 'releaseStrategicTokens',
  args: [investmentIndex],
})

write()  // Call function
```

## 🚀 Production Build

```bash
npm run build      # Generate dist/ folder
npm run preview    # Test production build locally
```

Deploy to Vercel, GitHub Pages, or your hosting platform.

---

**See [../README.md](../README.md) for the complete project overview.**
