import { useNavigate } from 'react-router-dom'
import { Zap, Lock, TrendingUp, Users } from 'lucide-react'

export default function Landing({ isConnected, connect }) {
  const navigate = useNavigate()

  if (isConnected) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="space-y-12">
          {/* Welcome Section */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
              AEOS Vesting Dashboard
            </h1>
            <p className="text-xl" style={{ color: 'var(--muted-foreground)' }}>
              Manage your token allocations across multiple vesting modules
            </p>
          </div>

          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategic Card */}
            <a href="/strategic" className="card-aeos p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={24} style={{ color: '#10B981' }} />
                <h2 className="text-xl font-bold">Strategic Investors</h2>
              </div>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                10% allocation, 6-month cliff, 5% quarterly unlock
              </p>
              <button className="btn-primary w-full">View Dashboard</button>
            </a>

            {/* Advisor Card */}
            <a href="/advisor" className="card-aeos p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <Users size={24} style={{ color: '#3B82F6' }} />
                <h2 className="text-xl font-bold">Advisors</h2>
              </div>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                5% allocation, 12-month cliff, 2.5% monthly unlock
              </p>
              <button className="btn-primary w-full">View Dashboard</button>
            </a>

            {/* Team Card */}
            <a href="/team" className="card-aeos p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={24} style={{ color: '#F59E0B' }} />
                <h2 className="text-xl font-bold">Team & Founders</h2>
              </div>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                10% allocation, 18-month cliff, 2% monthly unlock
              </p>
              <button className="btn-primary w-full">View Dashboard</button>
            </a>
          </div>

          {/* Admin Section */}
          <div className="border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="pt-12">
              <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Owner-only access to contract configuration and management
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a href="/admin" className="card-aeos p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <Zap size={20} style={{ color: 'var(--primary)' }} className="mx-auto mb-2" />
                  <div className="font-medium">Overview</div>
                </a>
                <a href="/admin/strategic" className="card-aeos p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <TrendingUp size={20} style={{ color: '#10B981' }} className="mx-auto mb-2" />
                  <div className="font-medium">Strategic</div>
                </a>
                <a href="/admin/advisor" className="card-aeos p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <Users size={20} style={{ color: '#3B82F6' }} className="mx-auto mb-2" />
                  <div className="font-medium">Advisors</div>
                </a>
                <a href="/admin/team" className="card-aeos p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <Lock size={20} style={{ color: '#F59E0B' }} className="mx-auto mb-2" />
                  <div className="font-medium">Team</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: 'var(--primary)' }}>
        AEOS Vesting Dashboard
      </h1>
      <p className="text-xl mb-8" style={{ color: 'var(--muted-foreground)' }}>
        Connect your wallet to view and manage your vesting allocations
      </p>
      <button
        onClick={() => connect({ connector: undefined })}
        className="btn-primary px-8 py-3"
      >
        Connect Wallet
      </button>
    </div>
  )
}
