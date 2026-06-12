import { useState } from 'react'
import { Menu, X, LogOut } from 'lucide-react'

export default function MobileNav({ isConnected, address, disconnect, onNavigate, currentPage }) {
  const [isOpen, setIsOpen] = useState(false)

  const truncateAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const navItems = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'strategic', label: 'Strategic' },
    { page: 'advisors', label: 'Advisors' },
    { page: 'admin', label: 'Admin' },
  ]

  const handleNavClick = (page) => {
    onNavigate(page)
    setIsOpen(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg transition-colors text-2xl"
        style={{
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          color: '#A0AEC0',
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-64 md:hidden transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#1A1F2E' }}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b" style={{ borderColor: '#2D3748' }}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold" style={{ color: '#FFB800' }}>
              AEOS Vesting
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{ color: '#A0AEC0', fontSize: '24px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Wallet Info */}
        {isConnected && (
          <div className="p-4 border-b" style={{ borderColor: '#2D3748' }}>
            <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }} className="mb-2">
              Connected Wallet
            </p>
            <p
              className="font-mono text-sm rounded px-3 py-2"
              style={{
                backgroundColor: '#0F1419',
                color: '#FFFFFF',
              }}
            >
              {truncateAddress(address)}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        {isConnected && (
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.page
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255, 184, 0, 0.1)'
                      : 'transparent',
                    color: isActive ? '#FFB800' : '#A0AEC0',
                    borderLeft: isActive ? '3px solid #FFB800' : '3px solid transparent',
                  }}
                >
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        )}

        {/* Drawer Footer */}
        {isConnected && (
          <div className="p-4 border-t" style={{ borderColor: '#2D3748' }}>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <LogOut size={18} />
              <span className="font-medium">Disconnect</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
