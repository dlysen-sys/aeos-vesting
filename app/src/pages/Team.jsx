import { useAccount } from 'wagmi'
import { AlertCircle } from 'lucide-react'

export default function Team() {
  const { address } = useAccount()

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="space-y-8">
      {!address && (
        <div style={{ backgroundColor: '#EF4444', padding: '16px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          <span>Connect your wallet to view team vesting details</span>
        </div>
      )}

      {/* Team Vesting Info */}
      <div className="card-aeos p-6">
        <h2 className="text-2xl font-bold mb-4">Team & Founders Vesting</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p style={{ color: '#A0AEC0', marginBottom: '8px' }}>Allocation</p>
            <p className="text-2xl font-bold">10%</p>
            <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>100,000,000 AEOS</p>
          </div>
          <div>
            <p style={{ color: '#A0AEC0', marginBottom: '8px' }}>Vesting Schedule</p>
            <p className="text-lg font-bold">18mo Cliff</p>
            <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>2% monthly unlock</p>
          </div>
        </div>
      </div>

      {/* Placeholder for Team Member Details */}
      <div className="card-aeos p-6">
        <h3 className="text-xl font-bold mb-4">Your Allocation</h3>
        <p style={{ color: '#A0AEC0' }}>Team member details coming soon...</p>
      </div>
      </div>
    </div>
  )
}
