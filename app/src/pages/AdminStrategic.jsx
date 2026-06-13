import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useAeosVesting } from '../hooks/useAeosVesting'
import { CONTRACTS, TOKENS } from '../config/contracts'
import { formatEther, parseEther } from 'viem'
import { ERC20_ABI } from '../config/abis'
import { formatSeconds } from '../utils/timeConversion'
import ContractButton from '../components/ContractButton'
import { AlertCircle, RefreshCw, Upload, Download, TrendingUp, Settings, Zap, UserPlus, Edit3 } from 'lucide-react'

export default function AdminStrategic() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const {
    addStrategicVesting,
    updateStrategicVesting,
    depositStrategicTokens,
    withdrawAEOS: withdrawAEOSHook,
    withdrawUSDT: withdrawUSDTHook,
    getFundingStatus,
    getFundingBreakdown,
    getBalanceStatus,
    setTreasuryWallet: setTreasuryWalletHook,
    setLiquidityContract: setLiquidityHook,
    withdrawUsdt: withdrawUsdtHook,
    setVestingConfiguration: setVestingConfigHook,
    setSlippageTolerance: setSlippageHook,
    setUsdtSplitBps: setUsdtSplitHook,
    getCliffPeriod,
    getUnlockPercent,
    getTotalVestingMonths,
    getWithdrawalPeriod,
    getSlippageBps,
    getUsdtLiquidityBps,
    getUsdtTreasuryBps,
    // Tier Pricing
    getTier1MaxUSDT,
    getTier1Price,
    getTier2MaxUSDT,
    getTier2Price,
    getTier3MaxUSDT,
    getTier3Price,
    getTier4Price,
    setTier1Pricing: setTier1PricingHook,
    setTier2Pricing: setTier2PricingHook,
    setTier3Pricing: setTier3PricingHook,
    setTier4Price: setTier4PriceHook,
  } = useAeosVesting()

  // Funding Status Queries
  // Note: getFundingStatus not yet implemented in contract
  // const fundingStatusQuery = getFundingStatus()

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [contractBalance, setContractBalance] = useState('0')
  const [activeTab, setActiveTab] = useState('deposit')
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Settings state — initialized empty, populated from smart contract
  const [treasuryAddr, setTreasuryAddr] = useState('')
  const [cliffMonths, setCliffMonths] = useState('')
  const [unlockPercent, setUnlockPercent] = useState('')
  const [vestingMonths, setVestingMonths] = useState('')
  const [withdrawalPeriod, setWithdrawalPeriod] = useState('')
  const [slippage, setSlippage] = useState('')
  const [liquidityBps, setLiquidityBps] = useState('')
  const [treasuryBps, setTreasuryBps] = useState('')

  // Tier Pricing state
  const [tier1MaxUSDT, setTier1MaxUSDT] = useState('100')
  const [tier1Price, setTier1Price] = useState('0.30')
  const [tier2MaxUSDT, setTier2MaxUSDT] = useState('500')
  const [tier2Price, setTier2Price] = useState('0.28')
  const [tier3MaxUSDT, setTier3MaxUSDT] = useState('2000')
  const [tier3Price, setTier3Price] = useState('0.24')
  const [tier4Price, setTier4Price] = useState('0.20')

  // Manage Vestings tab state
  const [addUser, setAddUser]           = useState('')
  const [addAmount, setAddAmount]       = useState('')
  const [addTimestamp, setAddTimestamp] = useState('')
  const [editUser, setEditUser]         = useState('')
  const [editIndex, setEditIndex]       = useState('')
  const [editFields, setEditFields]     = useState({
    amount: '', released: '', purchaseTime: '',
    releasedTime: '', cliffEnd: '', vestingEnd: '', isCompleted: false,
  })
  const [manageTab, setManageTab]       = useState('add')
  const [manageMsg, setManageMsg]       = useState({ type: '', text: '' })

  const ADMIN_TABS = [
    { id: 'deposit',  label: 'Deposit AEOS',     icon: Upload    },
    { id: 'withdraw', label: 'Withdraw Tokens',  icon: Download  },
    { id: 'funding',  label: 'Funding Status',   icon: TrendingUp},
    { id: 'settings', label: 'Settings',         icon: Settings  },
    { id: 'manage',   label: 'Manage Vestings',  icon: UserPlus  },
  ]

  const checkBalance = async () => {
    try {
      const balance = await publicClient.readContract({
        address: TOKENS.aeos,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [CONTRACTS.strategic],
      })
      setContractBalance(formatEther(balance))
      console.log('Contract AEOS balance updated:', formatEther(balance))
    } catch (err) {
      console.error('Error checking balance:', err)
      setError('Failed to fetch contract balance')
    }
  }

  // Fetch balance on component mount
  useEffect(() => {
    if (publicClient && address) {
      console.log('Page loaded - fetching initial balance')
      checkBalance()
    }
  }, [publicClient, address])

  // Fetch current contract configuration from smart contract
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Check if any contract data has loaded
        const hasAnyData = [
          getCliffPeriod.data,
          getUnlockPercent.data,
          getTotalVestingMonths.data,
          getWithdrawalPeriod.data,
          getSlippageBps.data,
          getUsdtLiquidityBps.data,
          getUsdtTreasuryBps.data,
        ].some(v => v !== undefined && v !== null)

        if (!hasAnyData) {
          setConfigLoading(true)
          return
        }

        console.log('[Config] Fetching current vesting configuration from contract...')

        // CONVERSION CONSTANTS
        const SECONDS_PER_MONTH = 30 * 86400 // 30 days * 86400 seconds

        // cliffPeriodSeconds: convert to months with proper rounding (2 decimals)
        if (getCliffPeriod.data !== undefined && getCliffPeriod.data !== null) {
          const cliffSeconds = Number(getCliffPeriod.data)
          const cliffMonths = cliffSeconds / SECONDS_PER_MONTH
          const cliffRounded = Math.round(cliffMonths * 100) / 100 // Round to 2 decimals
          console.log(`[Config] Cliff: ${cliffSeconds}s → ${cliffRounded} months`)
          setCliffMonths(String(cliffRounded))
        }

        // unlockPercentPerPeriod: already in basis points
        if (getUnlockPercent.data !== undefined && getUnlockPercent.data !== null) {
          console.log(`[Config] Unlock: ${getUnlockPercent.data} bps`)
          setUnlockPercent(String(getUnlockPercent.data))
        }

        // vestingEndSeconds: convert to months with proper rounding (2 decimals)
        if (getTotalVestingMonths.data !== undefined && getTotalVestingMonths.data !== null) {
          const vestingSeconds = Number(getTotalVestingMonths.data)
          const vestingMonths = vestingSeconds / SECONDS_PER_MONTH
          const vestingRounded = Math.round(vestingMonths * 100) / 100 // Round to 2 decimals
          console.log(`[Config] Vesting: ${vestingSeconds}s → ${vestingRounded} months`)
          setVestingMonths(String(vestingRounded))
        }

        // withdrawalPeriod: already in seconds
        if (getWithdrawalPeriod.data !== undefined && getWithdrawalPeriod.data !== null) {
          console.log(`[Config] Withdrawal: ${getWithdrawalPeriod.data} seconds`)
          setWithdrawalPeriod(String(getWithdrawalPeriod.data))
        }

        // slippageBps: already in basis points
        if (getSlippageBps.data !== undefined && getSlippageBps.data !== null) {
          console.log(`[Config] Slippage: ${getSlippageBps.data} bps`)
          setSlippage(String(getSlippageBps.data))
        }

        // usdtToLiquidityBps: already in basis points
        if (getUsdtLiquidityBps.data !== undefined && getUsdtLiquidityBps.data !== null) {
          console.log(`[Config] Liquidity: ${getUsdtLiquidityBps.data} bps`)
          setLiquidityBps(String(getUsdtLiquidityBps.data))
        }

        // usdtToTreasuryBps: already in basis points
        if (getUsdtTreasuryBps.data !== undefined && getUsdtTreasuryBps.data !== null) {
          console.log(`[Config] Treasury: ${getUsdtTreasuryBps.data} bps`)
          setTreasuryBps(String(getUsdtTreasuryBps.data))
        }

        console.log('[Config] ✅ Configuration loaded from smart contract')
        setConfigLoading(false)
      } catch (err) {
        console.error('[Config] ❌ Error:', err)
        setConfigLoading(false)
      }
    }
    fetchConfig()
  }, [getCliffPeriod.data, getUnlockPercent.data, getTotalVestingMonths.data, getWithdrawalPeriod.data, getSlippageBps.data, getUsdtLiquidityBps.data, getUsdtTreasuryBps.data])

  const handleApproveAEOS = async () => {
    if (!depositAmount || !address) {
      setError('Please enter an amount and connect wallet')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Approving AEOS token for Strategic contract...')
      const approveAmount = parseEther(depositAmount)
      const hash = await walletClient.writeContract({
        address: TOKENS.aeos,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.strategic, approveAmount],
      })
      console.log('Approval TX hash:', hash)
      setSuccess(`Approval initiated! TX: ${hash}. You can now deposit.`)
      // Refresh balance after approval
      setTimeout(() => {
        checkBalance()
      }, 1500)
    } catch (err) {
      console.error('Approval failed:', err)
      setError(`Approval failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || !address) {
      setError('Please enter an amount and connect wallet')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Depositing', depositAmount, 'AEOS')
      const hash = await depositStrategicTokens.writeAsync({ args: [parseEther(depositAmount)] })
      console.log('Transaction hash:', hash)
      setSuccess(`Deposit initiated! TX: ${hash}`)
      setDepositAmount('')
      // Refresh balance after deposit - call multiple times to catch block confirmation
      setTimeout(checkBalance, 1500)
      setTimeout(checkBalance, 3000)
    } catch (err) {
      console.error('Deposit failed:', err)
      setError(`Deposit failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawAEOS = async () => {
    if (!withdrawAmount || !withdrawAddress || !address) {
      setError('Please fill all fields and connect wallet')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Withdrawing', withdrawAmount, 'AEOS to', withdrawAddress)
      const hash = await withdrawAEOSHook.writeAsync({ args: [withdrawAddress, parseEther(withdrawAmount)] })
      console.log('Transaction hash:', hash)
      setSuccess(`Withdrawal initiated! TX: ${hash}`)
      setWithdrawAmount('')
      setWithdrawAddress('')
      // Refresh balance after withdrawal
      setTimeout(checkBalance, 1500)
      setTimeout(checkBalance, 3000)
    } catch (err) {
      console.error('Withdraw AEOS failed:', err)
      setError(`Withdrawal failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTreasury = async () => {
    if (!treasuryAddr) {
      setError('Please enter treasury address')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting treasury wallet:', treasuryAddr)
      const hash = await setTreasuryWalletHook.writeAsync({ args: [treasuryAddr] })
      console.log('Transaction hash:', hash)
      setSuccess(`Treasury wallet updated! TX: ${hash}`)
      setTreasuryAddr('')
    } catch (err) {
      console.error('Treasury update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetLiquidity = async () => {
    if (!liquidityBps) {
      setError('Please enter liquidity contract address')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting liquidity contract:', liquidityBps)
      const hash = await setLiquidityHook.writeAsync({ args: [liquidityBps] })
      console.log('Transaction hash:', hash)
      setSuccess(`Liquidity contract updated! TX: ${hash}`)
      setLiquidityBps('')
    } catch (err) {
      console.error('Liquidity update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfig = async () => {
    if (!cliffMonths || !unlockPercent || !vestingMonths) {
      setError('Please fill all configuration fields')
      return
    }

    // Validate minimum values
    const cliffNum = Number(cliffMonths)
    const vestingNum = Number(vestingMonths)

    if (cliffNum <= 0) {
      setError('Cliff period must be > 0 months')
      return
    }
    if (vestingNum <= 0) {
      setError('Vesting duration must be > 0 months')
      return
    }
    if (vestingNum < cliffNum) {
      setError(`Vesting (${vestingNum}m) must be >= cliff (${cliffNum}m)`)
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('[Update] Updating vesting configuration')
      console.log(`[Update] Cliff: ${cliffMonths} months, Vesting: ${vestingMonths} months`)

      // Convert decimal month values to BigInt (ceil to avoid rounding to 0)
      const cliffMonthsBigInt = BigInt(Math.ceil(Number(cliffMonths)))
      const vestingMonthsBigInt = BigInt(Math.ceil(Number(vestingMonths)))
      const unlockPercentBigInt = BigInt(unlockPercent)
      const withdrawalPeriodBigInt = BigInt(withdrawalPeriod)

      console.log(`[Update] Args (ceiled): cliff=${cliffMonthsBigInt}, unlock=${unlockPercentBigInt}, vesting=${vestingMonthsBigInt}, withdrawal=${withdrawalPeriodBigInt}`)

      const hash = await setVestingConfigHook.writeAsync({
        args: [
          parseEther('0.2'),  // vestingPrice (read-only from contract)
          parseEther('10'),   // minInvestment (read-only from contract)
          cliffMonthsBigInt,
          unlockPercentBigInt,
          vestingMonthsBigInt,
          withdrawalPeriodBigInt,
        ]
      })
      console.log('[Update] TX hash:', hash)
      setSuccess(`Configuration updated! TX: ${hash}`)
      // Refresh balance and config after update
      setTimeout(checkBalance, 1500)
      setTimeout(() => {
        getCliffPeriod.refetch?.()
        getUnlockPercent.refetch?.()
        getTotalVestingMonths.refetch?.()
        getWithdrawalPeriod.refetch?.()
      }, 2000)
    } catch (err) {
      console.error('Config update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetSlippage = async () => {
    if (!slippage) {
      setError('Please enter slippage value')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting slippage tolerance:', slippage)
      const hash = await setSlippageHook.writeAsync({ args: [BigInt(slippage)] })
      console.log('Transaction hash:', hash)
      setSuccess(`Slippage updated! TX: ${hash}`)
      // Refetch slippage value after update
      setTimeout(() => {
        getSlippageBps.refetch?.()
      }, 1500)
    } catch (err) {
      console.error('Slippage update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetUsdtSplit = async () => {
    if (!liquidityBps || !treasuryBps) {
      setError('Please fill all split percentages')
      return
    }
    const total = Number(liquidityBps) + Number(treasuryBps)
    if (total !== 10000) {
      setError(`Percentages must total 10000 (100%). Current: ${total}`)
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting USDT split:', liquidityBps, treasuryBps)
      const hash = await setUsdtSplitHook.writeAsync({ args: [BigInt(liquidityBps), BigInt(treasuryBps)] })
      console.log('Transaction hash:', hash)
      setSuccess(`USDT split updated! TX: ${hash}`)
      // Refetch split values after update
      setTimeout(() => {
        getUsdtLiquidityBps.refetch?.()
        getUsdtTreasuryBps.refetch?.()
      }, 1500)
    } catch (err) {
      console.error('USDT split update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  // Tier Pricing Handlers
  const handleSetTier1Pricing = async () => {
    if (!tier1MaxUSDT || !tier1Price) {
      setError('Please fill all tier 1 fields')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting Tier 1 pricing:', tier1MaxUSDT, tier1Price)
      const maxUSDTWei = parseEther(tier1MaxUSDT)
      const priceWei = parseEther(tier1Price)
      const hash = await setTier1PricingHook.writeAsync({ args: [maxUSDTWei, priceWei] })
      console.log('Transaction hash:', hash)
      setSuccess(`Tier 1 updated! TX: ${hash}`)
      setTimeout(() => {
        getTier1MaxUSDT.refetch?.()
        getTier1Price.refetch?.()
      }, 1500)
    } catch (err) {
      console.error('Tier 1 update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTier2Pricing = async () => {
    if (!tier2MaxUSDT || !tier2Price) {
      setError('Please fill all tier 2 fields')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting Tier 2 pricing:', tier2MaxUSDT, tier2Price)
      const maxUSDTWei = parseEther(tier2MaxUSDT)
      const priceWei = parseEther(tier2Price)
      const hash = await setTier2PricingHook.writeAsync({ args: [maxUSDTWei, priceWei] })
      console.log('Transaction hash:', hash)
      setSuccess(`Tier 2 updated! TX: ${hash}`)
      setTimeout(() => {
        getTier2MaxUSDT.refetch?.()
        getTier2Price.refetch?.()
      }, 1500)
    } catch (err) {
      console.error('Tier 2 update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTier3Pricing = async () => {
    if (!tier3MaxUSDT || !tier3Price) {
      setError('Please fill all tier 3 fields')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting Tier 3 pricing:', tier3MaxUSDT, tier3Price)
      const maxUSDTWei = parseEther(tier3MaxUSDT)
      const priceWei = parseEther(tier3Price)
      const hash = await setTier3PricingHook.writeAsync({ args: [maxUSDTWei, priceWei] })
      console.log('Transaction hash:', hash)
      setSuccess(`Tier 3 updated! TX: ${hash}`)
      setTimeout(() => {
        getTier3MaxUSDT.refetch?.()
        getTier3Price.refetch?.()
      }, 1500)
    } catch (err) {
      console.error('Tier 3 update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTier4Price = async () => {
    if (!tier4Price) {
      setError('Please fill tier 4 price')
      return
    }
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      console.log('Setting Tier 4 price:', tier4Price)
      const priceWei = parseEther(tier4Price)
      const hash = await setTier4PriceHook.writeAsync({ args: [priceWei] })
      console.log('Transaction hash:', hash)
      setSuccess(`Tier 4 updated! TX: ${hash}`)
      setTimeout(() => {
        getTier4Price.refetch?.()
      }, 1500)
    } catch (err) {
      console.error('Tier 4 update failed:', err)
      setError(`Update failed: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="space-y-8">
        {!address && (
        <div style={{ backgroundColor: '#EF4444', padding: '16px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          <span>Admin: Connect your wallet (must be contract owner)</span>
        </div>
      )}

      {/* Header */}
      <div className="card-aeos p-6">
        <h1 className="text-3xl font-bold mb-2">Strategic Investors — Admin</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>10% allocation, 100M AEOS</p>
      </div>

      {/* Contract Status */}
      <div className="card-aeos p-6">
        <h3 className="text-xl font-bold mb-4">Contract Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p style={{ color: '#A0AEC0' }}>Contract Address</p>
            <p className="font-mono text-sm break-all">{CONTRACTS.strategic}</p>
          </div>
          <div>
            <p style={{ color: '#A0AEC0' }}>AEOS Balance</p>
            <p className="font-mono font-bold text-lg" style={{ color: '#10B981' }}>
              {contractBalance} AEOS
            </p>
            <button
              onClick={checkBalance}
              className="btn-primary text-sm mt-2"
              style={{ backgroundColor: '#4A5568' }}
            >
              <RefreshCw size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Refresh Balance
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{ backgroundColor: '#EF4444', padding: '12px', borderRadius: '8px', color: 'white', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ backgroundColor: '#10B981', padding: '12px', borderRadius: '8px', color: 'white', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="card-aeos">
        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)', padding: '12px' }}>
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                backgroundColor: activeTab === id ? 'var(--primary)' : 'transparent',
                color: activeTab === id ? '#000' : 'var(--foreground)',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Upload size={18} /> Deposit AEOS
              </h4>
              <p style={{ color: '#A0AEC0' }}>Approve and deposit AEOS tokens so users can claim vesting rewards</p>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Amount (AEOS)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g., 1000000"
                  className="input-aeos w-full"
                />
              </div>
              <div className="space-y-2">
                <ContractButton
                  label={loading ? 'Processing...' : 'Step 1: Approve AEOS'}
                  onClick={handleApproveAEOS}
                  disabled={!depositAmount || loading}
                  variant="primary"
                  fullWidth
                />
                <ContractButton
                  label={loading ? 'Processing...' : 'Step 2: Deposit to Contract'}
                  onClick={handleDeposit}
                  disabled={!depositAmount || loading}
                  variant="success"
                  fullWidth
                />
              </div>
              <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
                💡 First approve the token, then deposit. Wait for approval confirmation before depositing.
              </p>
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Download size={18} /> Withdraw Tokens
              </h4>
              <p style={{ color: '#A0AEC0' }}>Transfer AEOS from contract to any address</p>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="input-aeos w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Amount (AEOS)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g., 500000"
                  className="input-aeos w-full"
                />
              </div>
              <ContractButton
                label={loading ? 'Processing...' : 'Withdraw AEOS'}
                onClick={handleWithdrawAEOS}
                disabled={!withdrawAmount || !withdrawAddress || loading}
                fullWidth
              />
            </div>
          )}

          {/* Funding Status Tab */}
          {activeTab === 'funding' && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={18} /> Funding Status
              </h4>
              <div className="card-aeos p-4">
                <p style={{ color: '#A0AEC0', marginBottom: '12px' }}>
                  📊 Real-time funding metrics from contract
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Current Balance</p>
                    <p style={{ color: '#10B981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {contractBalance} AEOS
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Contract Address</p>
                    <p style={{ color: '#FFB800', fontSize: '0.875rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {CONTRACTS.strategic.slice(0, 8)}...{CONTRACTS.strategic.slice(-6)}
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Total Allocation</p>
                    <p style={{ color: '#8B5CF6', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      100M AEOS
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                    <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Cliff Period</p>
                    <p style={{ color: '#3B82F6', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {getCliffPeriod.isLoading ? 'Loading...' : getCliffPeriod.data ? formatSeconds(getCliffPeriod.data) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={checkBalance}
                className="btn-primary text-sm w-full"
                style={{ backgroundColor: '#4A5568' }}
              >
                <RefreshCw size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Refresh Balance
              </button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Treasury Wallet */}
              <div className="border-t" style={{ borderColor: 'var(--border)', paddingTop: '16px' }}>
                <h5 className="font-bold mb-3">Set Treasury Wallet</h5>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={treasuryAddr}
                    onChange={(e) => setTreasuryAddr(e.target.value)}
                    placeholder="0x..."
                    className="input-aeos w-full text-sm"
                  />
                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Treasury'}
                    onClick={handleSetTreasury}
                    disabled={!treasuryAddr || loading}
                    variant="primary"
                    fullWidth
                  />
                </div>
              </div>

              {/* Vesting Configuration */}
              <div className="border-t" style={{ borderColor: 'var(--border)', paddingTop: '16px' }}>
                <h5 className="font-bold mb-3">Vesting Configuration</h5>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '12px' }}>
                  💡 Fields auto-populated with current contract values
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Cliff (months) *min 1</label>
                    <input
                      type="number"
                      value={configLoading ? '' : cliffMonths}
                      onChange={(e) => setCliffMonths(e.target.value)}
                      className="input-aeos w-full text-sm"
                      placeholder={configLoading ? 'Loading from contract...' : 'e.g., 6'}
                      min="1"
                      step="0.01"
                      disabled={configLoading}
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Smart Contract: {getCliffPeriod.isLoading ? 'Fetching...' : getCliffPeriod.data !== undefined ? `${(Number(getCliffPeriod.data) / (30 * 86400)).toFixed(2)} months` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Unlock % (bps)</label>
                    <input
                      type="number"
                      value={configLoading ? '' : unlockPercent}
                      onChange={(e) => setUnlockPercent(e.target.value)}
                      className="input-aeos w-full text-sm"
                      placeholder={configLoading ? 'Loading from contract...' : 'e.g., 500'}
                      disabled={configLoading}
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Smart Contract: {getUnlockPercent.isLoading ? 'Fetching...' : getUnlockPercent.data !== undefined ? `${getUnlockPercent.data} bps` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Total Vesting (months) *min 1</label>
                    <input
                      type="number"
                      value={configLoading ? '' : vestingMonths}
                      onChange={(e) => setVestingMonths(e.target.value)}
                      className="input-aeos w-full text-sm"
                      placeholder={configLoading ? 'Loading from contract...' : 'e.g., 60'}
                      min="1"
                      step="0.01"
                      disabled={configLoading}
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Smart Contract: {getTotalVestingMonths.isLoading ? 'Fetching...' : getTotalVestingMonths.data !== undefined ? `${(Number(getTotalVestingMonths.data) / (30 * 86400)).toFixed(2)} months` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Withdrawal Period (sec)</label>
                    <input
                      type="number"
                      value={configLoading ? '' : withdrawalPeriod}
                      onChange={(e) => setWithdrawalPeriod(e.target.value)}
                      className="input-aeos w-full text-sm"
                      placeholder={configLoading ? 'Loading from contract...' : 'e.g., 540'}
                      disabled={configLoading}
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Smart Contract: {getWithdrawalPeriod.isLoading ? 'Fetching...' : getWithdrawalPeriod.data !== undefined ? `${getWithdrawalPeriod.data} seconds` : 'N/A'}
                    </p>
                  </div>
                </div>
                <ContractButton
                  label={loading ? 'Processing...' : 'Update Configuration'}
                  onClick={handleUpdateConfig}
                  disabled={!cliffMonths || !unlockPercent || loading}
                  variant="primary"
                  fullWidth
                />
              </div>

              {/* Slippage */}
              <div className="border-t" style={{ borderColor: 'var(--border)', paddingTop: '16px' }}>
                <h5 className="font-bold mb-3">Liquidity Slippage</h5>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={configLoading ? '' : slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    placeholder={configLoading ? 'Loading from contract...' : '2500'}
                    className="input-aeos w-full text-sm"
                    disabled={configLoading}
                  />
                  <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                    Smart Contract: {getSlippageBps.isLoading ? 'Fetching...' : getSlippageBps.data !== undefined ? `${getSlippageBps.data} bps (${(Number(getSlippageBps.data) / 100).toFixed(2)}%)` : 'N/A'}
                  </p>
                  <p style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>💡 In basis points (2500 = 25%)</p>
                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Slippage'}
                    onClick={handleSetSlippage}
                    disabled={!slippage || loading}
                    variant="primary"
                    fullWidth
                  />
                </div>
              </div>

              {/* USDT Split */}
              <div className="border-t" style={{ borderColor: 'var(--border)', paddingTop: '16px' }}>
                <h5 className="font-bold mb-3">USDT Split (bps)</h5>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Liquidity (bps)</label>
                    <input
                      type="number"
                      value={configLoading ? '' : liquidityBps}
                      onChange={(e) => setLiquidityBps(e.target.value)}
                      placeholder={configLoading ? 'Loading from contract...' : '8000'}
                      className="input-aeos w-full text-sm"
                      disabled={configLoading}
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Smart Contract: {getUsdtLiquidityBps.isLoading ? 'Fetching...' : getUsdtLiquidityBps.data !== undefined ? `${getUsdtLiquidityBps.data} (${(Number(getUsdtLiquidityBps.data) / 100).toFixed(2)}%)` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Treasury (bps)</label>
                    <input
                      type="number"
                      value={configLoading ? '' : treasuryBps}
                      onChange={(e) => setTreasuryBps(e.target.value)}
                      placeholder={configLoading ? 'Loading from contract...' : '2000'}
                      className="input-aeos w-full text-sm"
                      disabled={configLoading}
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Smart Contract: {getUsdtTreasuryBps.isLoading ? 'Fetching...' : getUsdtTreasuryBps.data !== undefined ? `${getUsdtTreasuryBps.data} (${(Number(getUsdtTreasuryBps.data) / 100).toFixed(2)}%)` : 'N/A'}
                    </p>
                  </div>
                </div>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '12px' }}>
                  💡 Must total 10000 (100%)
                </p>
                <ContractButton
                  label={loading ? 'Processing...' : 'Update Split'}
                  onClick={handleSetUsdtSplit}
                  disabled={!liquidityBps || !treasuryBps || loading}
                  variant="primary"
                  fullWidth
                />
              </div>

              {/* Tiered Pricing Management */}
              <div className="border-t" style={{ borderColor: 'var(--border)', paddingTop: '16px' }}>
                <h5 className="font-bold mb-4">⭐ Tiered Pricing Management</h5>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '12px' }}>
                  Configure discount tiers for bulk purchases. All values in wei format (multiply by 1e18).
                </p>

                {/* Tier 1 */}
                <div className="mb-6 p-4 rounded border" style={{ borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                  <h6 className="font-bold mb-3" style={{ color: '#FFB800' }}>Tier 1: 10-100 USDT</h6>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Max USDT (wei)</label>
                      <input
                        type="number"
                        value={tier1MaxUSDT}
                        onChange={(e) => setTier1MaxUSDT(e.target.value)}
                        className="input-aeos w-full text-sm"
                        placeholder="100000000000000000000"
                      />
                      <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                        Current: {getTier1MaxUSDT.isLoading ? 'Loading...' : getTier1MaxUSDT.data !== undefined ? `${formatEther(BigInt(getTier1MaxUSDT.data))}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Price per AEOS (wei)</label>
                      <input
                        type="number"
                        value={tier1Price}
                        onChange={(e) => setTier1Price(e.target.value)}
                        className="input-aeos w-full text-sm"
                        placeholder="300000000000000000"
                      />
                      <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                        Current: {getTier1Price.isLoading ? 'Loading...' : getTier1Price.data !== undefined ? `$${formatEther(BigInt(getTier1Price.data))}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Tier 1'}
                    onClick={handleSetTier1Pricing}
                    disabled={!tier1MaxUSDT || !tier1Price || loading}
                    variant="primary"
                    fullWidth
                  />
                </div>

                {/* Tier 2 */}
                <div className="mb-6 p-4 rounded border" style={{ borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                  <h6 className="font-bold mb-3" style={{ color: '#FFB800' }}>Tier 2: 101-500 USDT</h6>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Max USDT (wei)</label>
                      <input
                        type="number"
                        value={tier2MaxUSDT}
                        onChange={(e) => setTier2MaxUSDT(e.target.value)}
                        className="input-aeos w-full text-sm"
                        placeholder="500000000000000000000"
                      />
                      <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                        Current: {getTier2MaxUSDT.isLoading ? 'Loading...' : getTier2MaxUSDT.data !== undefined ? `${formatEther(BigInt(getTier2MaxUSDT.data))}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Price per AEOS (wei)</label>
                      <input
                        type="number"
                        value={tier2Price}
                        onChange={(e) => setTier2Price(e.target.value)}
                        className="input-aeos w-full text-sm"
                        placeholder="280000000000000000"
                      />
                      <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                        Current: {getTier2Price.isLoading ? 'Loading...' : getTier2Price.data !== undefined ? `$${formatEther(BigInt(getTier2Price.data))}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Tier 2'}
                    onClick={handleSetTier2Pricing}
                    disabled={!tier2MaxUSDT || !tier2Price || loading}
                    variant="primary"
                    fullWidth
                  />
                </div>

                {/* Tier 3 */}
                <div className="mb-6 p-4 rounded border" style={{ borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                  <h6 className="font-bold mb-3" style={{ color: '#FFB800' }}>Tier 3: 501-2000 USDT</h6>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Max USDT (wei)</label>
                      <input
                        type="number"
                        value={tier3MaxUSDT}
                        onChange={(e) => setTier3MaxUSDT(e.target.value)}
                        className="input-aeos w-full text-sm"
                        placeholder="2000000000000000000000"
                      />
                      <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                        Current: {getTier3MaxUSDT.isLoading ? 'Loading...' : getTier3MaxUSDT.data !== undefined ? `${formatEther(BigInt(getTier3MaxUSDT.data))}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Price per AEOS (wei)</label>
                      <input
                        type="number"
                        value={tier3Price}
                        onChange={(e) => setTier3Price(e.target.value)}
                        className="input-aeos w-full text-sm"
                        placeholder="240000000000000000"
                      />
                      <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                        Current: {getTier3Price.isLoading ? 'Loading...' : getTier3Price.data !== undefined ? `$${formatEther(BigInt(getTier3Price.data))}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Tier 3'}
                    onClick={handleSetTier3Pricing}
                    disabled={!tier3MaxUSDT || !tier3Price || loading}
                    variant="primary"
                    fullWidth
                  />
                </div>

                {/* Tier 4 */}
                <div className="mb-6 p-4 rounded border" style={{ borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                  <h6 className="font-bold mb-3" style={{ color: '#FFB800' }}>Tier 4: 2001+ USDT (Unbounded)</h6>
                  <div>
                    <label style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Price per AEOS (wei)</label>
                    <input
                      type="number"
                      value={tier4Price}
                      onChange={(e) => setTier4Price(e.target.value)}
                      className="input-aeos w-full text-sm"
                      placeholder="200000000000000000"
                    />
                    <p style={{ color: '#8B5CF6', fontSize: '0.65rem', marginTop: '2px' }}>
                      Current: {getTier4Price.isLoading ? 'Loading...' : getTier4Price.data !== undefined ? `$${formatEther(BigInt(getTier4Price.data))}` : 'N/A'}
                    </p>
                  </div>
                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Tier 4'}
                    onClick={handleSetTier4Price}
                    disabled={!tier4Price || loading}
                    variant="primary"
                    fullWidth
                    style={{ marginTop: '12px' }}
                  />
                </div>
              </div>
            </div>
          )}
          {/* ── MANAGE VESTINGS TAB ─────────────────────────────── */}
          {activeTab === 'manage' && (
            <div className="space-y-6">

              {/* Sub-tab switcher */}
              <div className="flex gap-2">
                {[{ id: 'add', label: 'Add Vesting', icon: UserPlus }, { id: 'edit', label: 'Edit Vesting', icon: Edit3 }].map(t => (
                  <button key={t.id} onClick={() => { setManageTab(t.id); setManageMsg({ type: '', text: '' }) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: manageTab === t.id ? 'var(--primary)' : 'var(--muted)',
                      color: manageTab === t.id ? '#000' : 'var(--foreground)',
                    }}>
                    <t.icon size={14} />{t.label}
                  </button>
                ))}
              </div>

              {manageMsg.text && (
                <div className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: manageMsg.type === 'error' ? '#EF444420' : '#10B98120',
                           color: manageMsg.type === 'error' ? '#EF4444' : '#10B981' }}>
                  {manageMsg.text}
                </div>
              )}

              {/* ── ADD ── */}
              {manageTab === 'add' && (
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Records a vesting position for a user without any USDT transfer, liquidity routing,
                    or referral bonus. Use for off-chain purchases and manual allocations.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Beneficiary Address
                      </label>
                      <input className="w-full p-3 rounded-lg border text-sm font-mono"
                        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        placeholder="0x..."
                        value={addUser} onChange={e => setAddUser(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        AEOS Amount
                      </label>
                      <input className="w-full p-3 rounded-lg border text-sm"
                        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        type="number" placeholder="e.g. 50000"
                        value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Purchase Timestamp — cliff and vesting end are calculated from this date
                      </label>
                      <input className="w-full p-3 rounded-lg border text-sm"
                        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        type="datetime-local"
                        value={addTimestamp} onChange={e => setAddTimestamp(e.target.value)} />
                    </div>
                  </div>

                  <ContractButton
                    label={loading ? 'Processing...' : 'Add Vesting Record'}
                    onClick={async () => {
                      setManageMsg({ type: '', text: '' })
                      if (!addUser || !addAmount || !addTimestamp) {
                        return setManageMsg({ type: 'error', text: 'All fields are required.' })
                      }
                      try {
                        setLoading(true)
                        const amountWei = parseEther(addAmount)
                        const ts = BigInt(Math.floor(new Date(addTimestamp).getTime() / 1000))
                        const hash = await addStrategicVesting.writeAsync({ args: [addUser, amountWei, ts] })
                        setManageMsg({ type: 'success', text: `Vesting added. TX: ${hash}` })
                        setAddUser(''); setAddAmount(''); setAddTimestamp('')
                      } catch (e) {
                        console.error('addStrategicVesting error:', e)
                        setManageMsg({ type: 'error', text: e.shortMessage || e.message })
                      } finally { setLoading(false) }
                    }}
                    disabled={loading}
                    variant="primary"
                    fullWidth
                  />
                </div>
              )}

              {/* ── EDIT ── */}
              {manageTab === 'edit' && (
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Edit every field of an existing Investment record. Global totals (sold, allocated,
                    claimable) are reconciled automatically.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Investor Address
                      </label>
                      <input className="w-full p-3 rounded-lg border text-sm font-mono col-span-2"
                        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        placeholder="0x..."
                        value={editUser} onChange={e => setEditUser(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Investment Index
                      </label>
                      <input className="w-full p-3 rounded-lg border text-sm"
                        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        type="number" placeholder="0"
                        value={editIndex} onChange={e => setEditIndex(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'amount',       label: 'Amount (AEOS)',       placeholder: 'e.g. 50000',     isDate: false },
                      { key: 'released',     label: 'Released (AEOS)',     placeholder: 'e.g. 2500',      isDate: false },
                      { key: 'purchaseTime', label: 'Purchase Timestamp',  placeholder: '',               isDate: true  },
                      { key: 'releasedTime', label: 'Last Release Timestamp', placeholder: '',            isDate: true  },
                      { key: 'cliffEnd',     label: 'Cliff End Timestamp', placeholder: '',               isDate: true  },
                      { key: 'vestingEnd',   label: 'Vesting End Timestamp', placeholder: '',             isDate: true  },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                          {f.label}
                        </label>
                        <input className="w-full p-3 rounded-lg border text-sm"
                          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                          type={f.isDate ? 'datetime-local' : 'number'}
                          placeholder={f.placeholder}
                          value={editFields[f.key]}
                          onChange={e => setEditFields(prev => ({ ...prev, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                    <input type="checkbox" id="isCompleted"
                      checked={editFields.isCompleted}
                      onChange={e => setEditFields(prev => ({ ...prev, isCompleted: e.target.checked }))} />
                    <label htmlFor="isCompleted" className="text-sm">Mark as Completed</label>
                  </div>

                  <ContractButton
                    label={loading ? 'Processing...' : 'Update Vesting Record'}
                    onClick={async () => {
                      setManageMsg({ type: '', text: '' })
                      const { amount, released, purchaseTime, releasedTime, cliffEnd, vestingEnd, isCompleted } = editFields
                      if (!editUser || editIndex === '' || !amount || !purchaseTime || !cliffEnd || !vestingEnd) {
                        return setManageMsg({ type: 'error', text: 'Address, index, amount, and all timestamps are required.' })
                      }
                      const toTs = v => BigInt(Math.floor(new Date(v).getTime() / 1000))
                      try {
                        setLoading(true)
                        const updateStruct = [
                          parseEther(amount),
                          parseEther(released || '0'),
                          toTs(purchaseTime),
                          toTs(releasedTime || purchaseTime),
                          toTs(cliffEnd),
                          toTs(vestingEnd),
                          isCompleted,
                        ]
                        const hash = await updateStrategicVesting.writeAsync({
                          args: [editUser, BigInt(editIndex), updateStruct],
                        })
                        setManageMsg({ type: 'success', text: `Vesting updated. TX: ${hash}` })
                      } catch (e) {
                        console.error('updateStrategicVesting error:', e)
                        setManageMsg({ type: 'error', text: e.shortMessage || e.message })
                      } finally { setLoading(false) }
                    }}
                    disabled={loading}
                    variant="primary"
                    fullWidth
                  />
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  )
}
