import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useAeosVesting } from '../hooks/useAeosVesting'
import { formatEther, parseEther } from 'viem'

const ADVISOR_CONFIG = {
  title: 'Advisors & Partnerships',
  cliff: '12 months',
  unlockRate: '2.5% monthly',
  totalAllocated: '50,000,000 AEOS',
  minUSDT: 10,
  pricePerAEOS: 0.2,
}

export default function Advisors() {
  const { address, isConnected } = useAccount()
  const [usdtAmount, setUsdtAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    buyAdvisor,
    releaseAdvisor,
    getAdvisorInvestmentCount,
    getAdvisorClaimable,
    approveUSDT,
    getUSDTBalance,
  } = useAeosVesting()

  const { data: investmentCount } = getAdvisorInvestmentCount()
  const { data: usdtBalance } = getUSDTBalance()

  const aeosAmount = usdtAmount ? (parseFloat(usdtAmount) / ADVISOR_CONFIG.pricePerAEOS).toFixed(2) : '0'

  const handlePurchase = async () => {
    try {
      setError('')
      setLoading(true)

      if (!usdtAmount || parseFloat(usdtAmount) < ADVISOR_CONFIG.minUSDT) {
        setError(`Minimum purchase is ${ADVISOR_CONFIG.minUSDT} USDT`)
        return
      }

      console.log(`Approving ${usdtAmount} USDT...`)
      const approveTx = await approveUSDT.writeAsync?.({
        args: [parseEther(usdtAmount)],
      })
      console.log('Approval TX:', approveTx)

      console.log(`Buying ${aeosAmount} AEOS for ${usdtAmount} USDT...`)
      const buyTx = await buyAdvisor.writeAsync?.({
        args: [parseEther(usdtAmount)],
      })
      console.log('Purchase TX:', buyTx)

      setUsdtAmount('')
    } catch (err) {
      console.error('Purchase error:', err)
      setError(err.message || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">{ADVISOR_CONFIG.title}</h2>
          <p style={{ color: '#A0AEC0' }}>Advisor vesting program with monthly releases</p>
        </div>

      {/* Module Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-aeos">
          <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>
            Cliff Period
          </p>
          <p className="text-2xl font-bold">{ADVISOR_CONFIG.cliff}</p>
        </div>
        <div className="card-aeos">
          <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>
            Unlock Rate
          </p>
          <p className="text-2xl font-bold">{ADVISOR_CONFIG.unlockRate}</p>
        </div>
        <div className="card-aeos">
          <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>
            Total Allocated
          </p>
          <p className="text-xl font-bold">{ADVISOR_CONFIG.totalAllocated}</p>
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
            <h3 className="text-xl font-bold mb-4">Buy Advisor Vesting</h3>

            {error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#EF4444', color: '#FFF' }}>
                {error}
              </div>
            )}

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
                  min={ADVISOR_CONFIG.minUSDT}
                />
              </div>

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

            {investmentCount && parseInt(investmentCount) > 0 ? (
              <div className="space-y-3">
                {Array.from({ length: parseInt(investmentCount) }).map((_, idx) => (
                  <InvestmentRow key={idx} investmentIndex={idx} address={address} />
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

function InvestmentRow({ investmentIndex, address }) {
  const { getAdvisorClaimable, releaseAdvisor } = useAeosVesting()
  const { data: claimable } = getAdvisorClaimable(investmentIndex)
  const [releasing, setReleasing] = useState(false)

  const handleRelease = async () => {
    try {
      setReleasing(true)
      console.log(`Releasing investment ${investmentIndex}...`)
      await releaseAdvisor.writeAsync?.({
        args: [BigInt(investmentIndex)],
      })
    } catch (err) {
      console.error('Release error:', err)
    } finally {
      setReleasing(false)
    }
  }

  return (
    <div className="p-4 rounded" style={{ backgroundColor: '#2D3748' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-sm">Investment #{investmentIndex}</span>
        <span style={{ color: '#10B981' }}>{claimable ? formatEther(BigInt(claimable)).slice(0, 10) : '0'} AEOS Claimable</span>
      </div>
      <button
        onClick={handleRelease}
        disabled={releasing || !claimable || BigInt(claimable) === BigInt(0)}
        className="btn-primary w-full text-sm"
        style={{
          opacity: releasing || !claimable || BigInt(claimable) === BigInt(0) ? 0.5 : 1,
        }}
      >
        {releasing ? 'Releasing...' : 'Claim Tokens'}
      </button>
    </div>
  )
}
