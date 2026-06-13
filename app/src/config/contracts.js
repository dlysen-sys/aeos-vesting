/**
 * AEOS Vesting Contract Addresses & Configuration
 *
 * ⚠️ CHANGE THIS TO SWITCH NETWORKS
 * Options: 31337 (Hardhat Local), 97 (BSC Testnet), 56 (BSC Mainnet)
 */

export const ACTIVE_CHAIN_ID = 31337; // Change this to switch networks

/**
 * Network-specific contract addresses
 */
const NETWORK_ADDRESSES = {
  31337: {
    // Hardhat Local — 2026-06-13 (AdminOwnable on all + import order cleanup)
    genealogy: '0xB377a2EeD7566Ac9fCb0BA673604F9BF875e2Bab',
    team:      '0x66F625B8c4c635af8b74ECe2d7eD0D58b4af3C3d',
    strategic: '0x8bCe54ff8aB45CB075b044AE117b8fD91F9351aB',
    advisors:  '0x74Cf9087AD26D541930BaC724B7ab21bA8F00a27',
    reserves:  '0xefAB0Beb0A557E452b398035eA964948c750b2Fd',
  },
  97: {
    // BSC Testnet (update after deployment)
    genealogy: '0x0000000000000000000000000000000000000000',
    team: '0x0000000000000000000000000000000000000000',
    strategic: '0x0000000000000000000000000000000000000000',
    advisors: '0x0000000000000000000000000000000000000000',
    reserves: '0x0000000000000000000000000000000000000000',
  },
  56: {
    // BSC Mainnet (update after deployment)
    genealogy: '0x0000000000000000000000000000000000000000',
    team: '0x0000000000000000000000000000000000000000',
    strategic: '0x0000000000000000000000000000000000000000',
    advisors: '0x0000000000000000000000000000000000000000',
    reserves: '0x0000000000000000000000000000000000000000',
  },
};

/**
 * Token addresses (same across all networks - BSC addresses)
 */
const NETWORK_TOKENS = {
  31337: {
    aeos: '0x4bf010f1b9beDA5450a8dD702ED602A104ff65EE',  // AEOS COIN (Mock - Hardhat 2026-06-13 latest)
    usdt: '0xfcDB4564c18A9134002b9771816092C9693622e3',  // USDT Tether (Mock - Hardhat 2026-06-13 latest)
  },
  97: {
    aeos: '0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a',
    usdt: '0x55d398326f99059fF775485246999027B3197955',
  },
  56: {
    aeos: '0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a',
    usdt: '0x55d398326f99059fF775485246999027B3197955',
  },
};

// Export current network's contracts
export const CONTRACTS = NETWORK_ADDRESSES[ACTIVE_CHAIN_ID];
export const TOKENS = NETWORK_TOKENS[ACTIVE_CHAIN_ID];

// Wallet Addresses (same across all networks)
export const WALLETS = {
  treasury: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  liquidity: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  communityIncentives: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  ecosystem: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  communityGrowth: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
}

// Deployment Info (reference the latest deployment file)
export const DEPLOYMENT = {
  network: 'hardhat',
  deploymentFile: 'deployments/deployment-latest.json',
  note: 'Always refers to the latest deployment. Check this file for current contract addresses.',
}
