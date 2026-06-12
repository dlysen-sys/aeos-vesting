import { useState } from 'react'
import { useAccount } from 'wagmi'
import { AlertCircle, Upload, Download, TrendingUp, Settings } from 'lucide-react'

export default function AdminTeam() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState('deposit')

  const ADMIN_TABS = [
    { id: 'deposit', label: 'Deposit AEOS', icon: Upload },
    { id: 'withdraw', label: 'Withdraw Tokens', icon: Download },
    { id: 'funding', label: 'Funding Status', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="space-y-8">
        {!address && (
          <div style={{ backgroundColor: '#EF4444', padding: '16px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} />
            <span>Admin: Connect your wallet (must be contract owner)</span>
          </div>
        )}

      <div className="card-aeos p-6">
        <h1 className="text-3xl font-bold mb-2">Team & Founders — Admin</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>10% allocation, 100M AEOS</p>
      </div>

      <div className="card-aeos p-6">
        <div className="flex gap-2 flex-wrap">
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all`}
              style={{
                backgroundColor: activeTab === id ? '#F59E0B' : 'transparent',
                color: activeTab === id ? '#000' : 'var(--foreground)',
                border: activeTab === id ? '1px solid #F59E0B' : '1px solid var(--border)',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="p-6 mt-4">
          <p style={{ color: '#A0AEC0' }}>Team module admin panel — coming soon</p>
        </div>
      </div>
    </div>
    </div>
  )
}
