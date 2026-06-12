import { createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Define Hardhat local chain (chainId 31337)
export const hardhatLocal = defineChain({
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
})

export const wagmiConfig = createConfig({
  chains: [hardhatLocal, bscTestnet, bsc],
  connectors: [injected()],
  transports: {
    [hardhatLocal.id]: http('http://127.0.0.1:8545'),
    [bscTestnet.id]: http(),
    [bsc.id]: http(),
  },
})

export const AEOS_ADDRESS = '0x89417b107aD0eF0Ce0dA82c5d6fD6c81F6e0d25A'
export const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

// Contract addresses (Latest deployment: Hardhat Local - 2026-06-09T04:03:46.707Z)
export const CONTRACTS = {
  team: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1',
  strategic: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44',
  advisors: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f',
  reserves: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319',
}
