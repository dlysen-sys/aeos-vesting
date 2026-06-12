# AEOS Vesting — Smart Contract Development (Hardhat)

Smart contract development environment for the AEOS token vesting system.

## 📋 Quick Commands

```bash
# Install dependencies
npm install

# Compile Solidity contracts
npm run compile

# Run test suite
npm run test

# Deploy to BSC Testnet
npm run deploy -- --network bscTestnet

# Deploy to BSC Mainnet
npm run deploy:bsc

# Verify on BSCScan
npm run verify -- <address> --network bsc
```

## 🌐 Running Hardhat Local Network

Start a local blockchain for development and testing:

```bash
# Terminal 1: Start Hardhat node (runs on localhost:8545)
npx hardhat node
```

The Hardhat node will:
- Start a local Ethereum-compatible blockchain on `http://127.0.0.1:8545`
- Create 20 pre-funded test accounts (each with 10,000 ETH)
- Display account addresses and private keys for testing

### Deploy to Local Network

In a separate terminal, deploy contracts to the running local node:

```bash
# Terminal 2: Deploy to local Hardhat network
npm run deploy -- --network hardhat
```

This will:
- Compile contracts (if needed)
- Deploy all vesting modules to the local network
- Save deployment addresses to `deployment-hardhat-<timestamp>.json`
- Display contract addresses for frontend integration

### Running Tests Against Local Network

```bash
# Run tests against Hardhat network
npm run test
```

### Using with Frontend

Once the Hardhat node is running, update the frontend configuration in `../app/src/config/contracts.js`:

```javascript
CONTRACTS = {
  strategic: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',  // From deployment output
  advisors: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  team: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  reserves: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
}
```

Then the React frontend will connect to the local network for development.

## 🦊 MetaMask Configuration

### Add Hardhat Network to MetaMask

To connect MetaMask to your local Hardhat network:

**Network Details:**
- **Network Name:** Hardhat Local
- **New RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337` (Standard Hardhat local chain ID)
- **Currency Symbol:** `ETH`
- **Block Explorer URL:** (leave blank)

**Steps:**
1. Open MetaMask → Networks → Add Network
2. Fill in the details above
3. Click "Save"

**Alternative (Quick Add):**
Add this to your JavaScript console when Hardhat node is running:
```javascript
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0x7a37",  // 31337 in hex (Hardhat local)
    chainName: "Hardhat Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  }]
});
```

### Import Test Accounts

The Hardhat node creates 20 test accounts. Import them into MetaMask:

1. Get private key from Hardhat node output
2. MetaMask → Account Icon → Import Account
3. Paste private key
4. Click "Import"

**Example (from Hardhat node startup):**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadccb1e325f180ea68e4ec7
```

### Fund Accounts with Mock Tokens

Once deployed, import the USDT and AEOS tokens into MetaMask:

1. **MetaMask → Assets → Import Tokens**
2. Enter token address from deployment output:
   - **USDT:** `0x55d398326f99059fF775485246999027B3197955`
   - **AEOS:** `0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a`
3. Click "Add Custom Token"
4. You'll see your token balance (10M per test account)

---

## 📁 Folder Structure

```
hardhat/
├── contracts/              # Solidity smart contracts
│   ├── AeosVesting.sol
│   ├── AeosVestingTeam.sol
│   ├── AeosVestingStrategic.sol
│   ├── AeosVestingAdvisors.sol
│   ├── AeosVestingReserves.sol
│   ├── AeosLiquidityManager.sol
│   ├── interfaces/         # Contract interfaces (IAEOS, IUSDT, etc.)
│   └── libraries/          # Shared libraries (VestingMath, TickMath, etc.)
├── test/                   # Hardhat test files
│   ├── AeosVesting.test.js
│   ├── AeosVestingTeam.test.js
│   ├── AeosVestingStrategic.test.js
│   └── AeosVestingAdvisors.test.js
├── scripts/                # Deployment and utility scripts
│   ├── deploy.js           # Main deployment script
│   └── verify.js           # BSCScan verification
├── artifacts/              # Compiled contract ABIs (generated)
├── cache/                  # Hardhat compilation cache (generated)
├── hardhat.config.js       # Hardhat configuration
├── package.json
└── .env.example            # Environment variables template
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**
```
PRIVATE_KEY=your_deployer_private_key
BSC_TESTNET_RPC=https://data-seed-prebsc-1-e.bnbchain.org:8545
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Hardhat Configuration

Edit `hardhat.config.js` to configure networks:

```javascript
networks: {
  bscTestnet: {
    url: process.env.BSC_TESTNET_RPC,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 97,
  },
  bsc: {
    url: process.env.BSC_MAINNET_RPC,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 56,
  },
}
```

## 🧪 Smart Contract Details

### Vesting Modules

1. **AeosVestingTeam** (10%, 100M AEOS)
   - 18-month cliff
   - 2% monthly unlock
   - Owner-assigned vesting

2. **AeosVestingStrategic** (10%, 100M AEOS)
   - 6-month cliff
   - 5% quarterly unlock
   - Public purchase (min 10 USDT = 50 AEOS @ 0.2)

3. **AeosVestingAdvisors** (5%, 50M AEOS)
   - 12-month cliff
   - 2.5% monthly unlock
   - Public purchase (min 10 USDT)

4. **AeosVestingReserves** (Tracking module)
   - Treasury Reserve (25%, 250M AEOS)
   - Liquidity & Market Making (10%, 100M AEOS)
   - Community Incentives (20%, 200M AEOS)
   - Ecosystem Development (15%, 150M AEOS)
   - Community Growth (5%, 50M AEOS)

### Contract Addresses (Testnet)

To be updated after deployment.

### Contract Addresses (Mainnet)

To be updated after deployment.

## 📊 Deployment Steps

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Test Locally
```bash
npm run test
```

### 3. Deploy to Testnet
```bash
npm run deploy -- --network bscTestnet
```

### 4. Verify on Testnet (BSCScan)
```bash
npm run verify -- <contract_address> --network bscTestnet
```

### 5. Deploy to Mainnet
```bash
npm run deploy:bsc
```

### 6. Verify on Mainnet (BSCScan)
```bash
npm run verify -- <contract_address> --network bsc
```

## 🔐 Security Considerations

- **Owner Functions:** All administrative functions are protected with `onlyOwner`
- **Access Control:** Each module has clear access control boundaries
- **Reentrancy Guard:** Used on functions that transfer tokens
- **Safe Math:** OpenZeppelin's SafeERC20 for token transfers
- **Tested:** Unit tests cover all critical paths

## 📚 References

- [Hardhat Documentation](https://hardhat.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [BSC Documentation](https://docs.bnbchain.org/)
- [Solidity v0.8.24](https://docs.soliditylang.org/)

## 🛠️ Troubleshooting

### Compilation Errors

If you get compilation errors after pulling changes:

```bash
npm install
npm run compile
```

### Network Configuration Issues

Verify your `.env` file has correct RPC URLs and API keys.

### Deployment Failures

- Check wallet has sufficient BNB for gas
- Verify private key is correct
- Check network is correct (testnet vs mainnet)

## 📝 Notes

- Frontend ABIs are generated in `artifacts/contracts/` after compilation
- Copy ABIs to `../app/src/config/` for frontend integration
- Contract addresses should be updated in both frontend and deployment scripts

---

**For complete development guide, see [../CLAUDE.md](../CLAUDE.md)**
