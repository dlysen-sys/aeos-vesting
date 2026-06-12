require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 50,  // Lower runs = smaller bytecode (for deployment size)
        details: {
          yul: true,
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
      viaIR: true,  // Enable IR compilation for complex contracts
    },
  },
  networks: {
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 56,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97,
    },
    hardhat: {
      chainId: 31337,  // Standard Hardhat local chain ID (avoids conflicts with mainnet 56)
    },
    localhost: {
      url: "http://127.0.0.1:8545",  // Connect to persistent Hardhat node running on localhost:8545
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
