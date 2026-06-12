import { useEffect, useState } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { ACTIVE_CHAIN_ID } from '../config/contracts'

const CHAIN_NAMES = {
  31337: 'Hardhat Local',
  97: 'BSC Testnet',
  56: 'BSC Mainnet',
}

export default function NetworkChainAlert() {
  const currentChainId = useChainId()
  const { switchChain, isPending, isError, error } = useSwitchChain()
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (currentChainId && currentChainId !== ACTIVE_CHAIN_ID) {
      setShowAlert(true)
    } else {
      setShowAlert(false)
    }
  }, [currentChainId])

  if (!showAlert) {
    return null
  }

  const currentChainName = CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`
  const requiredChainName = CHAIN_NAMES[ACTIVE_CHAIN_ID] || `Chain ${ACTIVE_CHAIN_ID}`

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: ACTIVE_CHAIN_ID })
    } catch (err) {
      console.error('Failed to switch network:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-aeos max-w-md w-full border-2" style={{ borderColor: '#EF4444' }}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div style={{ color: '#EF4444', fontSize: '24px' }}>⚠️</div>
            <div>
              <h2 className="text-xl font-bold">Wrong Network</h2>
              <p style={{ color: '#A0AEC0' }} className="text-sm mt-1">
                Please switch to the correct blockchain network
              </p>
            </div>
          </div>

          <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: '#2D3748' }}>
            <div>
              <p style={{ color: '#A0AEC0' }} className="text-xs uppercase tracking-wider mb-1">
                Current Network
              </p>
              <p className="text-lg font-semibold">{currentChainName}</p>
              <p style={{ color: '#A0AEC0' }} className="text-xs mt-1">
                Chain ID: {currentChainId}
              </p>
            </div>

            <div style={{ borderColor: '#3D4758', borderTopWidth: '1px' }}></div>

            <div>
              <p style={{ color: '#A0AEC0' }} className="text-xs uppercase tracking-wider mb-1">
                Required Network
              </p>
              <p className="text-lg font-semibold" style={{ color: '#FFB800' }}>
                {requiredChainName}
              </p>
              <p style={{ color: '#A0AEC0' }} className="text-xs mt-1">
                Chain ID: {ACTIVE_CHAIN_ID}
              </p>
            </div>
          </div>

          {isError && (
            <div className="rounded-lg p-3" style={{ backgroundColor: '#EF4444', color: '#FFF' }}>
              <p className="text-xs">
                {error?.message || 'Failed to switch network. Please try again or switch manually in your wallet.'}
              </p>
            </div>
          )}

          <button
            onClick={handleSwitchNetwork}
            disabled={isPending}
            className="w-full py-3 rounded font-bold transition"
            style={{
              backgroundColor: '#FFB800',
              color: '#0F1419',
              opacity: isPending ? 0.5 : 1,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isPending) e.target.style.backgroundColor = '#FFC933'
            }}
            onMouseLeave={(e) => {
              if (!isPending) e.target.style.backgroundColor = '#FFB800'
            }}
          >
            {isPending ? 'Switching Network...' : `Switch to ${requiredChainName}`}
          </button>

          <p style={{ color: '#A0AEC0' }} className="text-xs text-center">
            Your wallet will request approval to switch networks
          </p>
        </div>
      </div>
    </div>
  )
}
