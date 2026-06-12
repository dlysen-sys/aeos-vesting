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
    // Hardhat Local (from deployments/deployment-latest.json - Updated: 2026-06-12)
    // ⚠️ TESTING ONLY: With deposit/withdraw functions + fast unlocking + tiered pricing + enhanced natspec
    team: '0x88D1aF96098a928eE278f162c1a84f339652f95b',
    strategic: '0x7Ce73F8f636C6bD3357A0A8a59e0ab6462C955B0',
    advisors: '0x87c470437282174b3f8368c7CF1Ac03bcAe57954',
    reserves: '0x746a48E39dC57Ff14B872B8979E20efE5E5100B1',
  },
  97: {
    // BSC Testnet (update after deployment)
    team: '0x0000000000000000000000000000000000000000',
    strategic: '0x0000000000000000000000000000000000000000',
    advisors: '0x0000000000000000000000000000000000000000',
    reserves: '0x0000000000000000000000000000000000000000',
  },
  56: {
    // BSC Mainnet (update after deployment)
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
    aeos: '0x04f1A5b9BD82a5020C49975ceAd160E98d8B77Af',  // AEOS COIN (deployed on Hardhat local - Latest)
    usdt: '0x05bB67cB592C1753425192bF8f34b95ca8649f09',  // USDT Tether (deployed on Hardhat local - Latest)
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
