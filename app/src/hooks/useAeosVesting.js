/**
 * Hook for interacting with AEOS vesting smart contracts
 * Provides read/write functions for all vesting modules
 */

import { useReadContract, useWriteContract, useAccount, usePublicClient } from 'wagmi'
import { parseEther, publicActions, walletActions } from 'viem'
import { useWalletClient } from 'wagmi'
import { CONTRACTS, TOKENS } from '../config/contracts'
import {
  AEOS_VESTING_TEAM_ABI,
  AEOS_VESTING_STRATEGIC_ABI,
  AEOS_VESTING_ADVISORS_ABI,
  AEOS_VESTING_RESERVES_ABI,
  ERC20_ABI,
} from '../config/abis'

export function useAeosVesting() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // ───── READ CONFIGURATION FROM CONTRACT ─────

  const getCliffPeriod = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'cliffPeriodSeconds',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getUnlockPercent = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'unlockPercentPerPeriod',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTotalVestingMonths = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'vestingEndSeconds',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getWithdrawalPeriod = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'withdrawalPeriod',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getSlippageBps = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'slippageBps',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getUsdtLiquidityBps = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'usdtToLiquidityBps',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getUsdtTreasuryBps = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'usdtToTreasuryBps',
    query: { enabled: !!CONTRACTS.strategic },
  })

  // ───── TIERED PRICING (STRICT TYPE DISCIPLINE) ─────
  // Contract requires wei (18 decimals) - NO conversions inside contract
  // Frontend multiplies by 1e18 before calling contract function
  const getPriceForAmount = async (usdtAmount) => {
    if (!publicClient) return null
    try {
      // usdtAmount should already be a raw number (e.g., 100 for 100 USDT)
      // Convert to wei by multiplying by 1e18
      const usdtAmountWei = BigInt(String(usdtAmount)) * BigInt(1e18)

      console.log(`Getting price for ${usdtAmount} USDT (${usdtAmountWei} wei)`)

      const price = await publicClient.readContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'getPriceForAmount',
        args: [usdtAmountWei],  // Pass wei directly - contract does NO conversions
      })
      console.log(`Price returned: ${price} wei`)
      return price
    } catch (err) {
      console.error('Error getting price:', err)
      return null
    }
  }

  // ───── STRATEGIC INVESTORS ─────

  const buyStrategic = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      console.log('buyStrategic.writeAsync called with:', config)
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'buyStrategicVesting',
        args: config.args,
        gas: 500000n,
      })
      console.log('buyStrategic TX hash:', hash)
      return hash
    },
  }

  const releaseStrategic = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      console.log('releaseStrategic.writeAsync called with:', config)
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'releaseStrategicTokens',
        args: config.args || [],
        gas: 200000n, // Set gas limit to avoid estimation overflow
      })
      console.log('releaseStrategic TX hash:', hash)
      return hash
    },
  }

  const getStrategicClaimable = (investmentIndex) =>
    useReadContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'getClaimableAmount',
      args: [address, investmentIndex],
      query: { enabled: !!address },
    })

  const getStrategicInvestmentCount = () => {
    const query = useReadContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'getInvestorSummary',
      args: [address],
      query: { enabled: !!address },
    })
    // Return investmentCount (4th element from summary)
    return {
      ...query,
      data: query.data ? query.data[3] : undefined,
    }
  }

  // ───── ADVISORS ─────

  const buyAdvisor = useWriteContract({
    address: CONTRACTS.advisors,
    abi: AEOS_VESTING_ADVISORS_ABI,
    functionName: 'buyAdvisorVesting',
  })

  const releaseAdvisor = useWriteContract({
    address: CONTRACTS.advisors,
    abi: AEOS_VESTING_ADVISORS_ABI,
    functionName: 'releaseAdvisorTokens',
  })

  const getAdvisorClaimable = (investmentIndex) =>
    useReadContract({
      address: CONTRACTS.advisors,
      abi: AEOS_VESTING_ADVISORS_ABI,
      functionName: 'getClaimableAmount',
      args: [address, investmentIndex],
      query: { enabled: !!address },
    })

  const getAdvisorInvestmentCount = () =>
    useReadContract({
      address: CONTRACTS.advisors,
      abi: AEOS_VESTING_ADVISORS_ABI,
      functionName: 'getUserInvestmentCount',
      args: [address],
      query: { enabled: !!address },
    })

  // ───── TEAM ─────

  const assignTeamMember = useWriteContract({
    address: CONTRACTS.team,
    abi: AEOS_VESTING_TEAM_ABI,
    functionName: 'assignTeamMember',
  })

  const depositTeamTokens = useWriteContract({
    address: CONTRACTS.team,
    abi: AEOS_VESTING_TEAM_ABI,
    functionName: 'depositTeamTokens',
  })

  const releaseTeamTokens = useWriteContract({
    address: CONTRACTS.team,
    abi: AEOS_VESTING_TEAM_ABI,
    functionName: 'releaseTeamTokens',
  })

  const getTeamClaimable = (member) =>
    useReadContract({
      address: CONTRACTS.team,
      abi: AEOS_VESTING_TEAM_ABI,
      functionName: 'getClaimableAmount',
      args: [member],
      query: { enabled: !!member },
    })

  // ───── RESERVES ─────

  const getTreasuryBalance = () =>
    useReadContract({
      address: CONTRACTS.reserves,
      abi: AEOS_VESTING_RESERVES_ABI,
      functionName: 'getTreasuryBalance',
    })

  const getLiquidityBalance = () =>
    useReadContract({
      address: CONTRACTS.reserves,
      abi: AEOS_VESTING_RESERVES_ABI,
      functionName: 'getLiquidityBalance',
    })

  const getCommunityBalance = () =>
    useReadContract({
      address: CONTRACTS.reserves,
      abi: AEOS_VESTING_RESERVES_ABI,
      functionName: 'getCommunityBalance',
    })

  // ───── TOKEN INTERACTIONS ─────

  const approveUSDT = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      console.log('approveUSDT.writeAsync called with:', config)
      const hash = await walletClient.writeContract({
        address: TOKENS.usdt,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: config.args,
        gas: 100000n,
      })
      console.log('approveUSDT TX hash:', hash)
      return hash
    },
  }

  const getUSDTBalance = () =>
    useReadContract({
      address: TOKENS.usdt,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
      query: { enabled: !!address },
    })

  const getAEOSBalance = () =>
    useReadContract({
      address: TOKENS.aeos,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
      query: { enabled: !!address },
    })

  // ===== ADMIN FUNCTIONS =====

  const depositStrategicTokens = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      console.log('depositStrategicTokens.writeAsync called with:', config)
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'depositStrategicTokens',
        args: config.args || [],
        gas: 200000n,
      })
      console.log('depositStrategicTokens TX hash:', hash)
      return hash
    },
  }

  const withdrawAEOS = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      console.log('withdrawAEOS.writeAsync called with:', config)
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'withdrawAEOS',
        args: config.args || [],
        gas: 200000n,
      })
      console.log('withdrawAEOS TX hash:', hash)
      return hash
    },
  }

  const withdrawUSDT = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      console.log('withdrawUSDT.writeAsync called with:', config)
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'withdrawUSDT',
        args: config.args || [],
        gas: 200000n,
      })
      console.log('withdrawUSDT TX hash:', hash)
      return hash
    },
  }

  // ───── FUNDING MONITORING ─────

  const getFundingStatus = () =>
    useReadContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'getFundingStatus',
      args: [],
    })

  const getFundingBreakdown = () =>
    useReadContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'getFundingBreakdown',
      args: [],
    })

  const getBalanceStatus = () =>
    useReadContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'getBalanceStatus',
      args: [],
    })

  const canWithdrawAmount = (amount) =>
    useReadContract({
      address: CONTRACTS.strategic,
      abi: AEOS_VESTING_STRATEGIC_ABI,
      functionName: 'canWithdrawAmount',
      args: [amount],
    })

  // ───── OWNER CONFIGURATION FUNCTIONS ─────

  const setTreasuryWallet = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setTreasuryWallet',
        args: config.args,
        gas: 100000n,
      })
      return hash
    },
  }

  const setLiquidityContract = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setLiquidityContract',
        args: config.args,
        gas: 100000n,
      })
      return hash
    },
  }

  const withdrawUsdt = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'withdrawUsdt',
        args: config.args,
        gas: 200000n,
      })
      return hash
    },
  }

  const setVestingConfiguration = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setVestingConfiguration',
        args: config.args,
        gas: 300000n,
      })
      return hash
    },
  }

  const setSlippageTolerance = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setSlippageTolerance',
        args: config.args,
        gas: 100000n,
      })
      return hash
    },
  }

  const setUsdtSplitBps = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setUsdtSplitBps',
        args: config.args,
        gas: 100000n,
      })
      return hash
    },
  }

  // ───── TIERED PRICING READ FUNCTIONS ─────

  const getTier1MaxUSDT = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier1MaxUSDTWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTier1Price = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier1PriceWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTier2MaxUSDT = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier2MaxUSDTWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTier2Price = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier2PriceWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTier3MaxUSDT = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier3MaxUSDTWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTier3Price = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier3PriceWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  const getTier4Price = useReadContract({
    address: CONTRACTS.strategic,
    abi: AEOS_VESTING_STRATEGIC_ABI,
    functionName: 'tier4PriceWei',
    query: { enabled: !!CONTRACTS.strategic },
  })

  // ───── TIERED PRICING WRITE FUNCTIONS ─────

  const setTier1Pricing = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setTier1Pricing',
        args: config.args,
        gas: 150000n,
      })
      return hash
    },
  }

  const setTier2Pricing = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setTier2Pricing',
        args: config.args,
        gas: 150000n,
      })
      return hash
    },
  }

  const setTier3Pricing = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setTier3Pricing',
        args: config.args,
        gas: 150000n,
      })
      return hash
    },
  }

  const setTier4Price = {
    writeAsync: async (config) => {
      if (!walletClient) throw new Error('Wallet not connected')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.strategic,
        abi: AEOS_VESTING_STRATEGIC_ABI,
        functionName: 'setTier4Price',
        args: config.args,
        gas: 150000n,
      })
      return hash
    },
  }

  return {
    // Strategic
    buyStrategic,
    releaseStrategic,
    getStrategicClaimable,
    getStrategicInvestmentCount,
    // Advisors
    buyAdvisor,
    releaseAdvisor,
    getAdvisorClaimable,
    getAdvisorInvestmentCount,
    // Team
    assignTeamMember,
    depositTeamTokens,
    releaseTeamTokens,
    getTeamClaimable,
    // Reserves
    getTreasuryBalance,
    getLiquidityBalance,
    getCommunityBalance,
    // Tokens
    approveUSDT,
    getUSDTBalance,
    getAEOSBalance,
    // Admin Functions
    depositStrategicTokens,
    withdrawAEOS,
    withdrawUSDT,
    // Funding Monitoring
    getFundingStatus,
    getFundingBreakdown,
    getBalanceStatus,
    canWithdrawAmount,
    // Owner Configuration
    setTreasuryWallet,
    setLiquidityContract,
    withdrawUsdt,
    setVestingConfiguration,
    setSlippageTolerance,
    setUsdtSplitBps,
    // Configuration Reads
    getCliffPeriod,
    getUnlockPercent,
    getTotalVestingMonths,
    getWithdrawalPeriod,
    getSlippageBps,
    getUsdtLiquidityBps,
    getUsdtTreasuryBps,
    // Pricing - Read
    getPriceForAmount,
    getTier1MaxUSDT,
    getTier1Price,
    getTier2MaxUSDT,
    getTier2Price,
    getTier3MaxUSDT,
    getTier3Price,
    getTier4Price,
    // Pricing - Write
    setTier1Pricing,
    setTier2Pricing,
    setTier3Pricing,
    setTier4Price,
  }
}
