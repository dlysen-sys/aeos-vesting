import { useAccount, useBalance } from 'wagmi'
import { useAeosVesting } from '../hooks/useAeosVesting'
import { hardhatLocal } from '../config/wagmi'
import { formatEther } from 'viem'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const {
    getStrategicInvestmentCount,
    getAdvisorInvestmentCount,
    getTreasuryBalance,
    getLiquidityBalance,
    getCommunityBalance,
    getAEOSBalance,
    getUSDTBalance,
  } = useAeosVesting()

  // Native BNB/ETH balance (use connected wallet's network, not explicit chainId)
  const { data: bnbBalance, isLoading: isBnbLoading, error: bnbError } = useBalance({
    address: address,
    enabled: !!address,
  })

  // Debug BNB balance - show full structure
  console.log('🔍 BNB Balance Debug:', {
    address,
    isBnbLoading,
    bnbBalance: bnbBalance,
    bnbFormatted: bnbBalance?.formatted,
    bnbValue: bnbBalance?.value,
    bnbDecimals: bnbBalance?.decimals,
    bnbSymbol: bnbBalance?.symbol,
    bnbKeys: bnbBalance ? Object.keys(bnbBalance) : 'null',
    bnbError: bnbError?.message,
  })

  const { data: strategicCount } = getStrategicInvestmentCount()
  const { data: advisorCount } = getAdvisorInvestmentCount()
  const { data: treasuryBalance } = getTreasuryBalance()
  const { data: liquidityBalance } = getLiquidityBalance()
  const { data: communityBalance } = getCommunityBalance()
  const { data: aeosBalance, isLoading: isAeosLoading, error: aeosError } = getAEOSBalance()
  const { data: usdtBalance, isLoading: isUsdtLoading, error: usdtError } = getUSDTBalance()

  // Debug USDT and AEOS balances
  console.log('🔍 USDT Balance Debug:', {
    usdtBalance,
    isUsdtLoading,
    usdtError: usdtError?.message,
    usdtType: typeof usdtBalance,
    usdtValue: usdtBalance?.toString?.(),
  })
  if (usdtError) console.error('[Error] USDT Error Details:', usdtError.message)
  console.log('🔍 AEOS Balance Debug:', {
    aeosBalance,
    isAeosLoading,
    aeosError: aeosError?.message,
    aeosType: typeof aeosBalance,
    aeosValue: aeosBalance?.toString?.(),
  })

  const formatAmount = (value) => {
    if (!value) return '0'
    const formatted = formatEther(BigInt(value))
    return parseFloat(formatted).toFixed(2)
  }

  const modules = [
    {
      title: 'Strategic Investors',
      cliff: '6 months',
      unlock: '5% quarterly',
      allocated: '100,000,000 AEOS',
      href: 'strategic',
    },
    {
      title: 'Advisors & Partnerships',
      cliff: '12 months',
      unlock: '2.5% monthly',
      allocated: '50,000,000 AEOS',
      href: 'advisors',
    },
    {
      title: 'Team & Founders',
      cliff: '18 months',
      unlock: '2% monthly',
      allocated: '100,000,000 AEOS',
      href: 'team',
    },
  ]

  if (!isConnected) {
    return (
      <div className="card-aeos text-center py-16">
        <p style={{ color: '#A0AEC0' }}>Connect your wallet to view your vesting information</p>
      </div>
    )
  }

  // Debug logging - summary
  console.log('🐛 Dashboard Summary:', {
    walletAddress: address,
    bnb: bnbBalance?.value ? formatEther(BigInt(bnbBalance.value)).slice(0, 10) : '0',
    usdt: usdtBalance ? formatAmount(usdtBalance) : '0',
    aeos: aeosBalance ? formatAmount(aeosBalance) : '0',
    usdtLoading: isUsdtLoading,
    aeosLoading: isAeosLoading,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="space-y-12">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p style={{ color: '#A0AEC0' }}>Overview of your AEOS vesting allocations</p>
          {/* Debug: Show wallet address */}
          <p style={{ color: '#FFB800', fontSize: '12px' }} className="mt-4 font-mono">
            Wallet: {address}
          </p>
        </div>

        {/* DEBUG: Show balance fetch status */}
        {(isBnbLoading || bnbError) && (
          <div className="card-aeos p-4" style={{ borderLeft: '4px solid #FFB800' }}>
            <p className="text-sm font-bold mb-2">🐛 Debug: Balance Fetch Status</p>
            <div className="text-xs space-y-1" style={{ color: '#A0AEC0', fontFamily: 'monospace' }}>
              <p>Loading BNB: {isBnbLoading ? '⏳ Yes' : '[OK] No'}</p>
              <p>BNB Data: {bnbBalance ? '[OK] Received' : '❌ Empty'}</p>
              {bnbError && <p>Error: {bnbError.message}</p>}
            </div>
          </div>
        )}

        {/* Token Balances */}
        <div>
          <h3 className="text-xl font-bold mb-4">Your Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-aeos">
              <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>BNB Balance</p>
              <p className="text-2xl font-bold font-mono">
                {isBnbLoading ? '⏳' : bnbBalance?.value ? formatEther(BigInt(bnbBalance.value)).slice(0, 10) : '0'} BNB
              </p>
              <p className="text-xs mt-1" style={{ color: '#8B5CF6' }}>Network Gas</p>
              {bnbError && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Error: {bnbError.message}</p>}
            </div>
            <div className="card-aeos">
              <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>USDT Balance</p>
              <p className="text-2xl font-bold font-mono">
                {isUsdtLoading ? '⏳' : usdtBalance ? formatAmount(usdtBalance) : '0'} USDT
              </p>
              <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>For Purchases</p>
              {usdtError && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Error: {usdtError.message}</p>}
            </div>
            <div className="card-aeos">
              <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>AEOS Balance</p>
              <p className="text-2xl font-bold font-mono">
                {isAeosLoading ? '⏳' : aeosBalance ? formatAmount(aeosBalance) : '0'} AEOS
              </p>
              <p className="text-xs mt-1" style={{ color: '#10B981' }}>Vesting Tokens</p>
              {aeosError && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Error: {aeosError.message}</p>}
            </div>
          </div>
        </div>

        {/* Reserve Balances */}
        <div>
          <h3 className="text-xl font-bold mb-4">Reserve Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-aeos">
              <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>Treasury</p>
              <p className="text-lg font-mono">{formatAmount(treasuryBalance)} AEOS</p>
            </div>
            <div className="card-aeos">
              <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>Liquidity</p>
              <p className="text-lg font-mono">{formatAmount(liquidityBalance)} AEOS</p>
            </div>
            <div className="card-aeos">
              <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>Community</p>
              <p className="text-lg font-mono">{formatAmount(communityBalance)} AEOS</p>
            </div>
          </div>
        </div>

        {/* Vesting Modules */}
        <div>
          <h3 className="text-xl font-bold mb-4">Vesting Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card-aeos p-6">
          <h3 className="text-lg font-bold mb-3">How It Works</h3>
          <div className="space-y-2 text-sm" style={{ color: '#A0AEC0' }}>
            <p>
              <span style={{ color: '#FFB800' }}>📅 Cliff Period:</span> A waiting period before you can claim any tokens
            </p>
            <p>
              <span style={{ color: '#FFB800' }}>📈 Unlock Rate:</span> The percentage of tokens released at regular intervals after the cliff
            </p>
            <p>
              <span style={{ color: '#FFB800' }}>💰 Claimable:</span> Tokens you can release and transfer to your wallet
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ title, cliff, unlock, allocated, href }) {
  return (
    <div className="card-aeos p-6 hover:shadow-lg transition" style={{ cursor: 'pointer' }}>
      <h4 className="text-lg font-bold mb-4">{title}</h4>
      <div className="space-y-3">
        <div>
          <p className="text-xs mb-1" style={{ color: '#A0AEC0' }}>Cliff Period</p>
          <p className="font-mono text-sm">{cliff}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: '#A0AEC0' }}>Unlock Rate</p>
          <p className="font-mono text-sm">{unlock}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: '#A0AEC0' }}>Total Allocated</p>
          <p className="font-mono text-sm">{allocated}</p>
        </div>
        <div className="pt-2">
          <button
            className="w-full text-sm py-2 rounded transition"
            style={{
              backgroundColor: '#FFB800',
              color: '#0F1419',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#FFC933')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFB800')}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
