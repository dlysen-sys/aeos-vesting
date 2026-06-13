import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useAeosVesting } from '../hooks/useAeosVesting'
import { CONTRACTS, TOKENS } from '../config/contracts'
import { formatEther, parseEther } from 'viem'
import { ERC20_ABI } from '../config/abis'
import ContractButton from '../components/ContractButton'
import AdminGenealogy from './AdminGenealogy'
import { AlertCircle, RefreshCw, Upload, Download, BookOpen, Settings, Zap, TrendingUp, Users } from 'lucide-react'

export default function Admin({ activeAdminTab: propActiveAdminTab = 'deposit', activeContractModule = 'strategic' }) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [activeAdminTab, setActiveAdminTab] = useState(propActiveAdminTab)
  const {
    depositStrategicTokens,
    withdrawAEOS: withdrawAEOSHook,
    withdrawUSDT: withdrawUSDTHook,
    getFundingStatus,
    getFundingBreakdown,
    getBalanceStatus,
    setTreasuryWallet: setTreasuryWalletHook,
    setVestingConfiguration: setVestingConfigHook,
    setSlippageTolerance: setSlippageHook,
    setUsdtSplitBps: setUsdtSplitHook,
  } = useAeosVesting()

  // Settings state
  const [treasuryAddr, setTreasuryAddr] = useState('')
  const [cliffMonths, setCliffMonths] = useState('')
  const [unlockPercent, setUnlockPercent] = useState('')
  const [vestingMonths, setVestingMonths] = useState('')
  const [withdrawalPeriod, setWithdrawalPeriod] = useState('')
  const [slippage, setSlippage] = useState('')
  const [liquidityBps, setLiquidityBps] = useState('')
  const [treasuryBps, setTreasuryBps] = useState('')

  // Funding Status Queries
  const fundingStatusQuery = getFundingStatus()
  const fundingBreakdownQuery = getFundingBreakdown()
  const balanceStatusQuery = getBalanceStatus()

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [contractBalance, setContractBalance] = useState('0')

  // Check Strategic contract AEOS balance
  const checkBalance = async () => {
    try {
      const balance = await publicClient.readContract({
        address: TOKENS.aeos,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [CONTRACTS.strategic],
      })
      setContractBalance(formatEther(BigInt(balance)))
      console.log('[Tokens] Strategic AEOS Balance:', formatEther(BigInt(balance)))
    } catch (err) {
      console.error('Error checking balance:', err)
    }
  }

  // Fetch balance on component mount
  useEffect(() => {
    if (publicClient) {
      checkBalance()
    }
  }, [publicClient])

  // Approve and Deposit AEOS to Strategic contract
  const handleDeposit = async () => {
    if (!walletClient) throw new Error('Wallet not connected')
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      throw new Error('Enter a valid amount')
    }

    const amount = parseEther(depositAmount)
    console.log('Approving AEOS token...')

    // Step 1: Approve AEOS token (not USDT!)
    const approveTx = await walletClient.writeContract({
      address: TOKENS.aeos,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.strategic, amount],
      gas: 100000n,
    })
    console.log('Approve TX:', approveTx)
    await publicClient.waitForTransactionReceipt({ hash: approveTx })
    console.log('[OK] AEOS approval confirmed')

    // Step 2: Deposit AEOS to contract
    console.log('Depositing AEOS...')
    const depositTx = await depositStrategicTokens.writeAsync?.({
      args: [amount],
    })
    console.log('Deposit TX:', depositTx)
    await publicClient.waitForTransactionReceipt({ hash: depositTx })
    console.log('[OK] Deposit confirmed')

    setDepositAmount('')
    await checkBalance()

    return { message: `✅ Successfully deposited ${depositAmount} AEOS` }
  }

  // Withdraw AEOS from Strategic contract
  const handleWithdrawAEOS = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      throw new Error('Enter a valid amount')
    }

    if (!withdrawAddress || withdrawAddress.length !== 42) {
      throw new Error('Enter a valid recipient address (0x...)')
    }

    const amount = parseEther(withdrawAmount)
    console.log(`Withdrawing ${withdrawAmount} AEOS to ${withdrawAddress}...`)

    const tx = await withdrawAEOSHook.writeAsync?.({
      args: [withdrawAddress, amount],
    })
    console.log('Withdraw TX:', tx)

    await publicClient.waitForTransactionReceipt({ hash: tx })
    console.log('[OK] Withdrawal confirmed')

    setWithdrawAmount('')
    setWithdrawAddress('')
    await checkBalance()

    return { message: `✅ Successfully withdrew ${withdrawAmount} AEOS to ${withdrawAddress.slice(0, 10)}...` }
  }

  return (
    <div className="space-y-8">
      {!address && (
        <div style={{ backgroundColor: '#EF4444', padding: '16px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          <span>Admin: Connect your wallet (must be contract owner)</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('deposit')}
          className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'deposit'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Upload size={18} />
          Deposit
        </button>
        <button
          onClick={() => setActiveAdminTab('withdraw')}
          className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'withdraw'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Download size={18} />
          Withdraw
        </button>
        <button
          onClick={() => setActiveAdminTab('funding')}
          className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'funding'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <TrendingUp size={18} />
          Funding
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'settings'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Settings size={18} />
          Settings
        </button>
        <button
          onClick={() => setActiveAdminTab('genealogy')}
          className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 ${
            activeAdminTab === 'genealogy'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users size={18} />
          Genealogy
        </button>
      </div>

      {/* Contract Balance — Always visible */}
      <div className="card-aeos p-6">
        <h3 className="text-xl font-bold mb-4">Contract Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p style={{ color: '#A0AEC0' }}>Strategic Contract Address</p>
            <p className="font-mono text-sm break-all">{CONTRACTS.strategic}</p>
          </div>
          <div>
            <p style={{ color: '#A0AEC0' }}>AEOS Balance in Contract</p>
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

      {/* Deposit Section — Shown when activeAdminTab === 'deposit' */}
      {activeAdminTab === 'deposit' && (
      <div className="card-aeos p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload size={24} />Deposit AEOS to Contract</h3>
        <p style={{ color: '#A0AEC0', marginBottom: '16px' }}>
          Approve and deposit AEOS tokens so users can claim vesting rewards
        </p>

        <div className="space-y-4">
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

          <ContractButton
            label="Deposit to Contract"
            onClick={handleDeposit}
            disabled={!depositAmount}
            variant="success"
            fullWidth
          />
        </div>
      </div>
      )}

      {/* Withdraw Section — Shown when activeAdminTab === 'withdraw' */}
      {activeAdminTab === 'withdraw' && (
      <div className="card-aeos p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Download size={24} />Withdraw Tokens</h3>
        <p style={{ color: '#A0AEC0', marginBottom: '16px' }}>
          Transfer AEOS or USDT from contract to any address (no MetaMask add needed!)
        </p>

        <div className="space-y-4">
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
            label="Withdraw AEOS"
            onClick={handleWithdrawAEOS}
            disabled={!withdrawAmount || !withdrawAddress}
            fullWidth
          />
        </div>
      </div>
      )}

      {/* Funding Status — Shown when activeAdminTab === 'funding' */}
      {activeAdminTab === 'funding' && (
      <div className="card-aeos p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp size={24} />Funding Status</h3>
        <p style={{ color: '#A0AEC0', marginBottom: '16px' }}>
          Real-time funding requirement tracking and gap monitoring
        </p>

        {fundingStatusQuery.isLoading ? (
          <div style={{ color: '#A0AEC0', fontSize: '0.875rem', padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
            <p>Loading funding status...</p>
          </div>
        ) : fundingStatusQuery.error ? (
          <div style={{ color: '#EF4444', fontSize: '0.875rem', padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
            <p>Error loading funding status: {fundingStatusQuery.error.message}</p>
          </div>
        ) : fundingStatusQuery.data ? (
          <div className="space-y-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Total Promised</p>
                <p style={{ color: '#10B981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatEther(fundingStatusQuery.data[0])} AEOS
                </p>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Currently Funded</p>
                <p style={{ color: '#FFB800', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatEther(fundingStatusQuery.data[1])} AEOS
                </p>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Still Claimable</p>
                <p style={{ color: '#8B5CF6', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatEther(fundingStatusQuery.data[2])} AEOS
                </p>
              </div>
              <div style={{ padding: '12px', backgroundColor: fundingStatusQuery.data[4] ? '#10B98120' : '#EF444420', borderRadius: '6px', border: `2px solid ${fundingStatusQuery.data[4] ? '#10B981' : '#EF4444'}` }}>
                <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '4px' }}>Funding Gap</p>
                <p style={{ color: fundingStatusQuery.data[4] ? '#10B981' : '#EF4444', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {fundingStatusQuery.data[4] ? '✓ Fully Funded' : formatEther(fundingStatusQuery.data[3]) + ' AEOS'}
                </p>
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
              <p style={{ color: '#A0AEC0', fontSize: '0.75rem', marginBottom: '8px' }}>Funding Progress</p>
              <div style={{ width: '100%', height: '24px', backgroundColor: '#1a1f2e', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((Number(fundingStatusQuery.data[5]) / 100), 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FFB800, #10B981)',
                  transition: 'width 0.3s ease',
                }}></div>
              </div>
              <p style={{ color: '#10B981', fontSize: '0.875rem', marginTop: '8px' }}>
                {(Number(fundingStatusQuery.data[5]) / 100).toFixed(2)}% funded
              </p>
            </div>
          </div>
        ) : null}
      </div>
      )}

      {/* Settings — Shown when activeAdminTab === 'settings' */}
      {activeAdminTab === 'settings' && (
      <div className="space-y-6">
        {/* Treasury Wallet */}
        <div className="card-aeos p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap size={20} />Set Treasury Wallet</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                Treasury Address
              </label>
              <input
                type="text"
                value={treasuryAddr}
                onChange={(e) => setTreasuryAddr(e.target.value)}
                placeholder="0x..."
                className="input-aeos w-full"
              />
            </div>
            <ContractButton
              label="Update Treasury"
              onClick={() => setTreasuryWalletHook.writeAsync({ args: [treasuryAddr] })}
              disabled={!treasuryAddr}
              variant="primary"
              fullWidth
            />
          </div>
        </div>

        {/* Vesting Configuration */}
        <div className="card-aeos p-6">
          <h3 className="text-lg font-bold mb-4">Vesting Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Cliff (months)
                </label>
                <input
                  type="number"
                  value={cliffMonths}
                  onChange={(e) => setCliffMonths(e.target.value)}
                  placeholder="6"
                  className="input-aeos w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Unlock %
                </label>
                <input
                  type="number"
                  value={unlockPercent}
                  onChange={(e) => setUnlockPercent(e.target.value)}
                  placeholder="500"
                  className="input-aeos w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Vesting (months)
                </label>
                <input
                  type="number"
                  value={vestingMonths}
                  onChange={(e) => setVestingMonths(e.target.value)}
                  placeholder="60"
                  className="input-aeos w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Withdrawal (seconds)
                </label>
                <input
                  type="number"
                  value={withdrawalPeriod}
                  onChange={(e) => setWithdrawalPeriod(e.target.value)}
                  placeholder="540"
                  className="input-aeos w-full"
                />
              </div>
            </div>
            <ContractButton
              label="Update Configuration"
              onClick={() => setVestingConfigHook.writeAsync({
                args: [
                  parseEther('0.2'), // vestingPrice (0.2 USDT)
                  parseEther('10'),  // minInvestment (10 USDT)
                  BigInt(cliffMonths || 6),
                  BigInt(unlockPercent || 500),
                  BigInt(vestingMonths || 60),
                  BigInt(withdrawalPeriod || 540),
                ]
              })}
              disabled={!cliffMonths || !unlockPercent || !vestingMonths || !withdrawalPeriod}
              variant="primary"
              fullWidth
            />
          </div>
        </div>

        {/* Slippage & USDT Split */}
        <div className="card-aeos p-6">
          <h3 className="text-lg font-bold mb-4">Liquidity Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Slippage (bps)
                </label>
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  placeholder="2500"
                  className="input-aeos w-full"
                />
              </div>
              <div></div>
            </div>
            <ContractButton
              label="Update Slippage"
              onClick={() => setSlippageHook.writeAsync({
                args: [BigInt(slippage || 2500)]
              })}
              disabled={!slippage}
              variant="primary"
              fullWidth
            />
          </div>
        </div>

        {/* USDT Split */}
        <div className="card-aeos p-6">
          <h3 className="text-lg font-bold mb-4">USDT Split (Basis Points)</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Liquidity (bps)
                </label>
                <input
                  type="number"
                  value={liquidityBps}
                  onChange={(e) => setLiquidityBps(e.target.value)}
                  placeholder="8000"
                  className="input-aeos w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#A0AEC0' }}>
                  Treasury (bps)
                </label>
                <input
                  type="number"
                  value={treasuryBps}
                  onChange={(e) => setTreasuryBps(e.target.value)}
                  placeholder="2000"
                  className="input-aeos w-full"
                />
              </div>
            </div>
            <p style={{ color: '#A0AEC0', fontSize: '0.75rem' }}>
              💡 Must total 10000 (100%)
            </p>
            <ContractButton
              label="Update USDT Split"
              onClick={() => setUsdtSplitHook.writeAsync({
                args: [BigInt(liquidityBps || 8000), BigInt(treasuryBps || 2000)]
              })}
              disabled={!liquidityBps || !treasuryBps || (Number(liquidityBps) + Number(treasuryBps)) !== 10000}
              variant="primary"
              fullWidth
            />
          </div>
        </div>
      </div>
      )}

      {/* Genealogy — Shown when activeAdminTab === 'genealogy' */}
      {activeAdminTab === 'genealogy' && (
        <div className="card-aeos p-6">
          <AdminGenealogy />
        </div>
      )}

      {/* Instructions */}
      <div className="card-aeos p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen size={20} />Quick Start (Testing)</h3>
        <div style={{ color: '#A0AEC0', fontSize: '0.875rem', lineHeight: '1.6' }}>
          <p className="mb-3">
            <strong>1. Deposit AEOS:</strong> Enter amount (e.g., 1000000) and click "Deposit to Contract"
          </p>
          <p className="mb-3">
            <strong>2. Test Claims:</strong> Go to Strategic tab and make a purchase, then claim after cliff passes
          </p>
          <p className="mb-3">
            <strong>3. Withdraw:</strong> Enter recipient address and amount to transfer tokens without adding to MetaMask
          </p>
          <p>
            <strong>Admin Functions:</strong> depositStrategicTokens(amount), withdrawAEOS(to, amount), withdrawUSDT(to, amount)
          </p>
        </div>
      </div>
    </div>
  )
}
