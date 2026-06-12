import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePublicClient } from 'wagmi'
import { useAeosVesting } from '../hooks/useAeosVesting'
import { CONTRACTS, TOKENS } from '../config/contracts'
import { formatEther, parseEther } from 'viem'
import { ERC20_ABI, AEOS_VESTING_STRATEGIC_ABI } from '../config/abis'
import ContractButton from '../components/ContractButton'
import { CheckCircle, Lock, Unlock, Check } from 'lucide-react'

const STRATEGIC_CONFIG = {
  title: 'Strategic Investors',
  cliff: '6 months',
  unlockRate: '5% quarterly',
  totalAllocated: '100,000,000 AEOS',
  minUSDT: 10,
  pricePerAEOS: 0.2,
}

export default function Strategic() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [usdtAmount, setUsdtAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [investments, setInvestments] = useState([])
  const [refetchKey, setRefetchKey] = useState(0)
  const [investmentRefetchKey, setInvestmentRefetchKey] = useState(0)

  // Tiered pricing state
  const [currentTierPrice, setCurrentTierPrice] = useState(null)
  const [currentTier, setCurrentTier] = useState(null)
  const [discount, setDiscount] = useState(0)

  const {
    buyStrategic,
    releaseStrategic,
    getStrategicInvestmentCount,
    getStrategicClaimable,
    approveUSDT,
    getUSDTBalance,
    getPriceForAmount,
  } = useAeosVesting()

  const investmentCountQuery = getStrategicInvestmentCount()
  const { data: investmentCount, refetch: refetchInvestmentCount } = investmentCountQuery
  const { data: usdtBalance } = getUSDTBalance()

  // Fetch tiered price when USDT amount changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!usdtAmount || parseFloat(usdtAmount) === 0) {
        setCurrentTierPrice(null)
        setCurrentTier(null)
        setDiscount(0)
        return
      }

      try {
        const amount = parseFloat(usdtAmount)

        // Determine tier
        let tier = null
        if (amount <= 100) {
          tier = 1
        } else if (amount <= 500) {
          tier = 2
        } else if (amount <= 2000) {
          tier = 3
        } else {
          tier = 4
        }
        setCurrentTier(tier)

        // Get price from contract
        const priceWei = await getPriceForAmount(amount)
        if (priceWei) {
          const priceDecimal = parseFloat(formatEther(BigInt(priceWei)))
          setCurrentTierPrice(priceDecimal)

          // Calculate discount vs. tier 1 price (0.30)
          const tier1Price = 0.30
          const discountPercent = ((tier1Price - priceDecimal) / tier1Price * 100).toFixed(1)
          setDiscount(Math.max(0, discountPercent))
        }
      } catch (err) {
        console.error('Error fetching tier price:', err)
        setCurrentTierPrice(null)
      }
    }

    fetchPrice()
  }, [usdtAmount, getPriceForAmount])

  // Fetch investments from contract whenever investmentCount changes
  const fetchInvestments = async () => {
    console.log('[Investments] fetchInvestments called - investmentCount:', investmentCount, 'address:', address, 'publicClient:', !!publicClient, 'timestamp:', new Date().toISOString())
    if (!publicClient || !address || investmentCount === undefined) return

    const count = parseInt(investmentCount.toString())
    console.log('[Data] Investment count:', count, 'timestamp:', new Date().toISOString())
    if (count === 0) {
      setInvestments([])
      console.log('[Data] No investments found, timestamp:', new Date().toISOString())
      return
    }

    const investmentDetails = []
    for (let i = 0; i < count; i++) {
      try {
        console.log(`📊 Fetching investment ${i}... timestamp: ${new Date().toISOString()}`)
        const details = await publicClient.readContract({
          address: CONTRACTS.strategic,
          abi: AEOS_VESTING_STRATEGIC_ABI,
          functionName: 'getInvestmentDetails',
          args: [address, BigInt(i)],
        })
        console.log(`📊 Investment ${i} details:`, details, 'timestamp:', new Date().toISOString())
        investmentDetails.push({
          index: i,
          amount: details[0],
          released: details[1],
          claimable: details[2],
          purchaseTime: details[3],
          cliffEnd: details[5],
          vestingEnd: details[6],
          isCompleted: details[7],
        })
      } catch (err) {
        console.error(`❌ Error fetching investment ${i}:`, err.message)
      }
    }
    console.log('[Data] All investments fetched:', investmentDetails, 'timestamp:', new Date().toISOString())
    setInvestments(investmentDetails)
  }

  // Refetch when refetchKey changes - force manual refetch
  useEffect(() => {
    if (refetchKey > 0) {
      console.log('[Refetch] Manual refetch triggered, refetchKey:', refetchKey, 'timestamp:', new Date().toISOString())
      refetchInvestmentCount()
    }
  }, [refetchKey, refetchInvestmentCount])

  // Fetch investments when investmentCount changes
  useEffect(() => {
    fetchInvestments()
  }, [investmentCount, address, publicClient])

  // Refetch investment details when investmentRefetchKey changes
  useEffect(() => {
    if (investmentRefetchKey > 0) {
      console.log('[Refetch] Investment details refetch triggered, key:', investmentRefetchKey, 'timestamp:', new Date().toISOString())
      fetchInvestments()
    }
  }, [investmentRefetchKey])

  // Calculate AEOS amount using dynamic tier price
  const aeosAmount = usdtAmount && currentTierPrice
    ? (parseFloat(usdtAmount) / currentTierPrice).toFixed(2)
    : '0'

  const handlePurchase = async () => {
    try {
      setError('')
      setLoading(true)

      if (!usdtAmount || parseFloat(usdtAmount) < STRATEGIC_CONFIG.minUSDT) {
        setError(`Minimum purchase is ${STRATEGIC_CONFIG.minUSDT} USDT`)
        setLoading(false)
        return
      }

      // Check balance before purchase
      let balanceBefore = 0
      if (publicClient && address) {
        const balance = await publicClient.readContract({
          address: TOKENS.usdt,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        })
        balanceBefore = BigInt(balance)
        console.log('[Tokens] Balance BEFORE purchase:', formatEther(balanceBefore), 'USDT')
      }

      // Check if hooks have writeAsync
      if (!approveUSDT.writeAsync || !buyStrategic.writeAsync) {
        console.error('Hooks not ready:', { approveUSDT, buyStrategic })
        setError('Contract hooks not initialized. Try refreshing.')
        setLoading(false)
        return
      }

      // First verify the USDT contract exists at the expected address
      if (publicClient) {
        const usdtCode = await publicClient.getCode({
          address: TOKENS.usdt,
        })
        console.log('USDT contract bytecode at', TOKENS.usdt, ':', usdtCode.length, 'bytes')
        if (!usdtCode || usdtCode === '0x') {
          console.error('[Error] ERROR: USDT contract has NO CODE at that address!')
          setError('USDT contract not found at deployed address. Please redeploy.')
          setLoading(false)
          return
        }
      }

      // Check current allowance before approving
      console.log(`[Approval] Checking allowance for ${CONTRACTS.strategic}...`)
      const currentAllowance = await publicClient.readContract({
        address: TOKENS.usdt,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONTRACTS.strategic],
      })
      const allowanceBigInt = BigInt(currentAllowance)
      const requiredAmount = parseEther(usdtAmount)

      console.log(`[Approval] Current allowance: ${formatEther(allowanceBigInt)} USDT`)
      console.log(`[Approval] Required amount: ${usdtAmount} USDT`)

      if (allowanceBigInt < requiredAmount) {
        // Need to approve
        console.log(`[Approval] Insufficient allowance. Approving ${usdtAmount} USDT to ${CONTRACTS.strategic}...`)
        setError('')

        try {
          const approveTx = await approveUSDT.writeAsync({
            args: [CONTRACTS.strategic, requiredAmount],
          })
          console.log('[Approval] TX hash:', approveTx)

          // Wait for approval to be mined
          if (publicClient && approveTx) {
            console.log('[Approval] Waiting for transaction to be mined...')
            const receipt = await publicClient.waitForTransactionReceipt({ hash: approveTx })
            console.log('[Approval] Receipt:', receipt)
            if (receipt.status !== 'success') {
              throw new Error('Approval transaction failed')
            }
            console.log('[Approval] ✅ Confirmed!')

            // Verify the allowance was actually set
            const verifyAllowance = await publicClient.readContract({
              address: TOKENS.usdt,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [address, CONTRACTS.strategic],
            })
            console.log('[Approval] Verified allowance:', formatEther(BigInt(verifyAllowance)))
            if (BigInt(verifyAllowance) < requiredAmount) {
              throw new Error(`Allowance verification failed. Got ${formatEther(BigInt(verifyAllowance))}, required ${usdtAmount}`)
            }
          }
        } catch (approvalErr) {
          console.error('[Approval] ❌ Failed:', approvalErr)
          setError(`Approval failed: ${approvalErr.message}`)
          setLoading(false)
          return
        }
      } else {
        console.log(`[Approval] ✅ Allowance sufficient. Skipping approval.`)
      }

      // Final allowance check before purchase
      console.log('[Purchase] Performing final allowance check...')
      const finalAllowance = await publicClient.readContract({
        address: TOKENS.usdt,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONTRACTS.strategic],
      })
      if (BigInt(finalAllowance) < requiredAmount) {
        throw new Error(`Insufficient allowance for purchase. Got ${formatEther(BigInt(finalAllowance))}, required ${usdtAmount}`)
      }
      console.log('[Purchase] ✅ Allowance verified. Proceeding with purchase.')

      // Then buy (use wei format: frontend converts, contract receives wei directly)
      console.log(`[Purchase] Buying ${aeosAmount} AEOS for ${usdtAmount} USDT at $${currentTierPrice} per AEOS (Tier ${currentTier})...`)
      const usdtAmountWei = parseEther(usdtAmount)
      console.log(`[Purchase] Wei Format: ${usdtAmount} USDT = ${usdtAmountWei} wei`)
      console.log(`[Purchase] Contract: ${CONTRACTS.strategic}`)

      const buyTx = await buyStrategic.writeAsync({
        args: [usdtAmountWei],
      })
      console.log('[Purchase] TX hash:', buyTx)

      // Wait for purchase to be mined and verify it succeeded
      if (publicClient) {
        console.log('[Purchase] Waiting for transaction to be mined...')
        const purchaseReceipt = await publicClient.waitForTransactionReceipt({ hash: buyTx })
        console.log('[Purchase] Receipt:', purchaseReceipt)
        console.log('[Purchase] Status:', purchaseReceipt.status)
        console.log('[Purchase] Gas used:', purchaseReceipt.gasUsed?.toString())

        if (purchaseReceipt.status !== 'success') {
          throw new Error(`Purchase transaction failed with status: ${purchaseReceipt.status}`)
        }
        console.log('[OK] Purchase confirmed!')
      }

      // Check balance and investment count after purchase
      if (publicClient && address) {
        const balanceAfter = await publicClient.readContract({
          address: TOKENS.usdt,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        })
        console.log('[Tokens] Balance AFTER purchase:', formatEther(BigInt(balanceAfter)), 'USDT')
        console.log('[Tokens] Amount deducted:', usdtAmount, 'USDT')
        console.log('⚠️ CRITICAL: Balance did NOT change! Transfer failed inside contract.')

        // Check if investment was created
        try {
          const summary = await publicClient.readContract({
            address: CONTRACTS.strategic,
            abi: AEOS_VESTING_STRATEGIC_ABI,
            functionName: 'getInvestorSummary',
            args: [address],
          })
          console.log('[Data] Investor Summary AFTER purchase:', {
            investmentCount: summary[3]?.toString(),
            totalPurchased: formatEther(BigInt(summary[0])),
            totalClaimable: formatEther(BigInt(summary[2])),
          })

          // Check contract's totalUsdtRaised to see if USDT transferred
          const totalUsdtRaised = await publicClient.readContract({
            address: CONTRACTS.strategic,
            abi: [{inputs:[], name:'totalUsdtRaised', outputs:[{internalType:'uint256', name:'', type:'uint256'}], stateMutability:'view', type:'function'}],
            functionName: 'totalUsdtRaised',
          })
          console.log('[Tokens] Contract totalUsdtRaised:', formatEther(BigInt(totalUsdtRaised)), 'USDT')

          // Check the contract's ACTUAL USDT token balance
          const contractUsdtBalance = await publicClient.readContract({
            address: TOKENS.usdt,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [CONTRACTS.strategic],
          })
          console.log('[Tokens] Contract ACTUAL USDT token balance:', formatEther(BigInt(contractUsdtBalance)), 'USDT')

          if (parseInt(summary[3]) === 0) {
            console.error('[Error] NO INVESTMENT CREATED - Contract function did not execute correctly')
          }
        } catch (err) {
          console.error('[Error] Error reading investor summary:', err.message)
        }
      }

      setUsdtAmount('')
      setError('[OK] Purchase successful!')
      // Trigger refetch of investments
      setRefetchKey(prev => prev + 1)
    } catch (err) {
      console.error('Purchase error:', err)
      setError(`Error: ${err.message || err.toString()}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="space-y-12">
        <div>
          <h2 className="text-3xl font-bold mb-2">{STRATEGIC_CONFIG.title}</h2>
          <p style={{ color: '#A0AEC0' }}>Invest in AEOS with flexible vesting</p>
        </div>

        {/* Module Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-aeos">
            <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>
              Cliff Period
            </p>
            <p className="text-2xl font-bold">{STRATEGIC_CONFIG.cliff}</p>
          </div>
          <div className="card-aeos">
            <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>
              Unlock Rate
            </p>
            <p className="text-2xl font-bold">{STRATEGIC_CONFIG.unlockRate}</p>
          </div>
          <div className="card-aeos">
            <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>
              Total Allocated
            </p>
            <p className="text-xl font-bold">{STRATEGIC_CONFIG.totalAllocated}</p>
          </div>
        </div>

        {!isConnected ? (
          <div className="card-aeos text-center py-8">
            <p style={{ color: '#A0AEC0' }}>Connect your wallet to invest</p>
          </div>
        ) : (
          <>
            {/* Purchase Form */}
            <div className="card-aeos p-6">
              <h3 className="text-xl font-bold mb-4">Buy Strategic Vesting</h3>

              {error && (
                <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#EF4444', color: '#FFF' }}>
                  {error}
                </div>
              )}

              <button
                onClick={async () => {
                  if (!publicClient || !address) return
                  try {
                    const summary = await publicClient.readContract({
                      address: CONTRACTS.strategic,
                      abi: AEOS_VESTING_STRATEGIC_ABI,
                      functionName: 'getInvestorSummary',
                      args: [address],
                    })
                    console.log('🔍 Manual Check - Investor Summary:', {
                      investmentCount: summary[3]?.toString(),
                      totalPurchased: formatEther(BigInt(summary[0])),
                      totalClaimable: formatEther(BigInt(summary[2])),
                    })
                    alert(`Investments: ${summary[3]?.toString()}\nTotal AEOS: ${formatEther(BigInt(summary[0]))}`)
                  } catch (err) {
                    console.error('[Error] Check failed:', err)
                    alert(`Error: ${err.message}`)
                  }
                }}
                className="btn-primary w-full mb-4"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                🔍 Check Investments on Contract
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                    Your USDT Balance
                  </label>
                  <p className="text-lg font-mono">
                    {usdtBalance ? formatEther(BigInt(usdtBalance)).slice(0, 10) : '0'} USDT
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="10"
                    className="input-aeos w-full"
                    min={STRATEGIC_CONFIG.minUSDT}
                  />
                </div>

                {/* Tier Info */}
                {usdtAmount && currentTier && (
                  <div className="p-4 rounded border" style={{ borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p style={{ color: '#A0AEC0' }}>Current Tier</p>
                        <p className="font-bold" style={{ color: '#FFB800' }}>
                          Tier {currentTier}
                          {discount > 0 && ` (-${discount}%)`}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#A0AEC0' }}>Price per AEOS</p>
                        <p className="font-mono" style={{ color: '#10B981' }}>
                          {currentTierPrice ? `$${currentTierPrice.toFixed(4)}` : 'Loading...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                    You will receive (AEOS)
                  </label>
                  <p className="text-lg font-mono" style={{ color: '#FFB800' }}>
                    {aeosAmount} AEOS
                  </p>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={loading || !usdtAmount}
                  className="btn-primary w-full"
                  style={{
                    opacity: loading || !usdtAmount ? 0.5 : 1,
                    cursor: loading || !usdtAmount ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Processing...' : 'Purchase AEOS'}
                </button>
              </div>
            </div>

            {/* Your Investments */}
            <div className="card-aeos p-6">
              <h3 className="text-xl font-bold mb-4">Your Investments</h3>

              {investments.length > 0 ? (
                <div className="space-y-4">
                  {investments.map((inv) => (
                    <InvestmentRow
                      key={inv.index}
                      investment={inv}
                      address={address}
                      onClaimSuccess={() => setInvestmentRefetchKey(prev => prev + 1)}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: '#A0AEC0' }}>No investments yet</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InvestmentRow({ investment, address, onClaimSuccess }) {
  const { releaseStrategic } = useAeosVesting()
  const publicClient = usePublicClient()

  // Format dates
  const purchaseDate = new Date(Number(investment.purchaseTime) * 1000).toLocaleDateString()
  const cliffDate = new Date(Number(investment.cliffEnd) * 1000).toLocaleDateString()
  const vestingEnd = new Date(Number(investment.vestingEnd) * 1000).toLocaleDateString()

  // Calculate cliff status
  const now = Math.floor(Date.now() / 1000)
  const isCliffPassed = now > Number(investment.cliffEnd)
  const secondsRemaining = Math.max(0, Number(investment.cliffEnd) - now)

  // Format time remaining (minutes/hours for testing, days for production)
  let timeRemainingText = ''
  if (secondsRemaining === 0) {
    timeRemainingText = 'Now'
  } else if (secondsRemaining < 3600) { // Less than 1 hour - show minutes
    const minutes = Math.ceil(secondsRemaining / 60)
    timeRemainingText = `${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else if (secondsRemaining < 86400) { // Less than 1 day - show hours
    const hours = Math.ceil(secondsRemaining / 3600)
    timeRemainingText = `${hours} hour${hours !== 1 ? 's' : ''}`
  } else { // 1 day or more - show days
    const days = Math.ceil(secondsRemaining / 86400)
    timeRemainingText = `${days} day${days !== 1 ? 's' : ''}`
  }

  // Calculate unlock progress (unlocked = released + claimable)
  const totalAmount = BigInt(investment.amount)
  const releasedAmount = BigInt(investment.released)
  const claimableAmount = BigInt(investment.claimable)
  const unlockedAmount = releasedAmount + claimableAmount
  const progressPercent = totalAmount > 0n ? (unlockedAmount * 100n) / totalAmount : 0n

  const handleClaim = async () => {
    console.log(`Claiming investment ${investment.index}...`)
    const hash = await releaseStrategic.writeAsync?.({
      args: [BigInt(investment.index)],
    })
    console.log('Claim TX hash:', hash)
    if (onClaimSuccess) {
      setTimeout(() => onClaimSuccess(), 2000)
    }
    return { message: `💰 Successfully claimed ${formatEther(claimableAmount).slice(0, 10)} AEOS!` }
  }

  return (
    <div className="p-4 rounded border" style={{ backgroundColor: '#2D3748', borderColor: '#4A5568' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-bold text-lg">Investment #{investment.index}</span>
          <p className="text-xs" style={{ color: '#A0AEC0' }}>
            Purchased: {purchaseDate}
          </p>
        </div>
        <span style={{ color: investment.isCompleted ? '#10B981' : '#F59E0B' }} className="font-bold">
          {investment.isCompleted ? '[OK] Completed' : isCliffPassed ? '🔓 Unlocking' : '🔒 Cliff'}
        </span>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p style={{ color: '#A0AEC0' }}>Purchased</p>
          <p className="font-mono font-bold">{formatEther(totalAmount).slice(0, 10)} AEOS</p>
        </div>
        <div>
          <p style={{ color: '#A0AEC0' }}>Released</p>
          <p className="font-mono font-bold" style={{ color: '#10B981' }}>
            {formatEther(releasedAmount).slice(0, 10)} AEOS
          </p>
        </div>
        <div>
          <p style={{ color: '#A0AEC0' }}>Claimable</p>
          <p className="font-mono font-bold" style={{ color: '#FFB800' }}>
            {formatEther(claimableAmount).slice(0, 10)} AEOS
          </p>
        </div>
        <div>
          <p style={{ color: '#A0AEC0' }}>Progress</p>
          <p className="font-mono font-bold">{progressPercent.toString()}%</p>
        </div>
      </div>

      {/* Enhanced Progress Bar with Unlock Timeline */}
      <div className="mb-5">
        {/* Progress Label */}
        <div className="flex justify-between items-center mb-2">
          <span style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>Unlock Progress</span>
          <span style={{ color: '#FFB800', fontSize: '0.875rem', fontWeight: 'bold' }}>
            {progressPercent.toString()}% unlocked
          </span>
        </div>

        {/* Main Progress Bar */}
        <div
          style={{
            backgroundColor: '#1A202C',
            borderRadius: '8px',
            height: '12px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '8px',
          }}
        >
          {/* Unlocked portion (green) */}
          <div
            style={{
              backgroundColor: '#10B981',
              height: '100%',
              width: `${progressPercent.toString()}%`,
              transition: 'width 0.3s ease',
              position: 'relative',
            }}
          >
            {/* Pulse indicator */}
            {!investment.isCompleted && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '100%',
                  backgroundColor: '#FFB800',
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* Unlock Milestones */}
        <div style={{ position: 'relative', height: '20px', marginBottom: '4px' }}>
          {[0, 25, 50, 75, 100].map((milestone) => (
            <div
              key={milestone}
              style={{
                position: 'absolute',
                left: `${milestone}%`,
                top: '2px',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                fontSize: '0.625rem',
                color: progressPercent >= milestone ? '#10B981' : '#4A5568',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: progressPercent >= milestone ? '#10B981' : '#4A5568',
                  borderRadius: '50%',
                  margin: '0 auto',
                  marginBottom: '2px',
                }}
              />
              <span>{milestone}%</span>
            </div>
          ))}
        </div>

        {/* Next Unlock Info */}
        {!investment.isCompleted && isCliffPassed && (
          <div
            style={{
              backgroundColor: '#2D3748',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              marginTop: '8px',
            }}
          >
            <div style={{ color: '#A0AEC0', marginBottom: '4px' }}>
              📈 Next 5% unlock in:{' '}
              <span style={{ color: '#FFB800', fontWeight: 'bold' }}>
                {Math.ceil((secondsRemaining % 60) / 60) || 1} min
              </span>
            </div>
            <div style={{ color: '#A0AEC0' }}>
              ✅ Every <span style={{ color: '#10B981', fontWeight: 'bold' }}>1 minute</span> • 5% unlocks
            </div>
          </div>
        )}

        {investment.isCompleted && (
          <div
            style={{
              backgroundColor: '#1F4D2F',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#10B981',
              marginTop: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            ✅ Vesting Complete - 100% Unlocked
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Dates */}
      <div className="text-xs mb-4" style={{ color: '#A0AEC0' }}>
        <p>
          Cliff: {cliffDate} {isCliffPassed ? '[OK] Passed' : `(${timeRemainingText} remaining)`}
        </p>
        <p>Vesting ends: {vestingEnd}</p>
      </div>

      {/* Claim Button */}
      <ContractButton
        label={claimableAmount > 0n ? '💰 Claim Tokens' : '[OK] Nothing to Claim'}
        onClick={handleClaim}
        disabled={!claimableAmount || claimableAmount === 0n || investment.isCompleted}
        variant={claimableAmount > 0n && !investment.isCompleted ? 'success' : 'secondary'}
        size="md"
        fullWidth
        onSuccess={onClaimSuccess}
      />
    </div>
  )
}
