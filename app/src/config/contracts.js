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
    // Hardhat Local (from deployments/deployment-latest.json - Updated: 2026-06-11)
    // ⚠️ TESTING ONLY: With deposit/withdraw functions + fast unlocking + tiered pricing + enhanced natspec
    team: '0x6DcBc91229d812910b54dF91b5c2b592572CD6B0',
    strategic: '0x245e77E56b1514D77910c9303e4b44dDb44B788c',
    advisors: '0xE2b5bDE7e80f89975f7229d78aD9259b2723d11F',
    reserves: '0xC6c5Ab5039373b0CBa7d0116d9ba7fb9831C3f42',
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
    aeos: '0x9d136eEa063eDE5418A6BC7bEafF009bBb6CFa70',  // AEOS COIN (deployed on Hardhat local - Latest)
    usdt: '0x6212cb549De37c25071cF506aB7E115D140D9e42',  // USDT Tether (deployed on Hardhat local - Latest)
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
