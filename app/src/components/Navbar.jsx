import { useChainId, usePublicClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CONTRACTS } from '../config/contracts'
import MobileNav from './MobileNav'
import ThemeToggle from './ThemeToggle'
import { LogOut, Upload, Download, Settings, RefreshCw, Users, Wallet } from 'lucide-react'

const STRATEGIC_OWNER_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// Contract modules
const CONTRACT_MODULES = [
  { id: 'strategic', label: 'Strategic', color: '#10B981' },
  { id: 'advisors', label: 'Advisors', color: '#3B82F6' },
  { id: 'team', label: 'Team', color: '#F59E0B' },
  { id: 'reserves', label: 'Reserves', color: '#8B5CF6' },
]

// Admin functions for each module
const ADMIN_FUNCTIONS = [
  { id: 'deposit', label: 'Deposit AEOS', icon: Upload, color: '#10B981' },
  { id: 'withdraw', label: 'Withdraw Tokens', icon: Download, color: '#EF4444' },
  { id: 'funding', label: 'Funding Status', icon: RefreshCw, color: '#FFB800' },
  { id: 'settings', label: 'Settings', icon: Settings, color: '#8B5CF6' },
]

const ADMIN_MODULES = [
  { path: '/admin', label: 'Overview', color: '#FFB800' },
  { path: '/admin/strategic', label: 'Strategic', color: '#10B981' },
  { path: '/admin/advisor', label: 'Advisors', color: '#3B82F6' },
  { path: '/admin/team', label: 'Team', color: '#F59E0B' },
  { path: '/admin/genealogy', label: 'Genealogy', color: '#EC4899' },
]

export default function Navbar({ isConnected, address, disconnect, connect }) {
  const location = useLocation()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [isOwner, setIsOwner] = useState(false)
  const [adminTabsWrap, setAdminTabsWrap] = useState(false)

  // Check if current user is the owner
  useEffect(() => {
    const checkOwner = async () => {
      if (!address || !publicClient) {
        setIsOwner(false)
        return
      }

      try {
        const ownerAddress = await publicClient.readContract({
          address: CONTRACTS.strategic,
          abi: STRATEGIC_OWNER_ABI,
          functionName: 'owner',
        })

        setIsOwner(ownerAddress?.toLowerCase() === address.toLowerCase())
      } catch (err) {
        console.error('Error checking owner:', err)
        setIsOwner(false)
      }
    }

    checkOwner()
  }, [address, publicClient])

  const truncateAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getNetworkName = () => {
    if (chainId === 31337) return 'Hardhat Local'
    if (chainId === 97) return 'BSC Testnet'
    if (chainId === 56) return 'BSC Mainnet'
    return 'Unknown Network'
  }

  const getNetworkIcon = () => {
    return null // Lucide icons will be added after dev server restart
  }

  const NavLink = ({ path, label }) => {
    const isActive = location.pathname === path
    return (
      <Link
        to={path}
        style={{
          color: isActive ? '#FFB800' : '#A0AEC0',
          textDecoration: 'none',
          borderBottom: isActive ? '2px solid #FFB800' : 'none',
          paddingBottom: '4px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = '#FFB800'
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.color = '#A0AEC0'
        }}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 py-4" style={{  borderBottom: '0px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>AEOS Vesting</h1>
          {isConnected && (
            <div className="hidden md:flex gap-6">
              <NavLink path="/" label="Home" />
              <NavLink path="/strategic" label="Strategic" />
              <NavLink path="/advisor" label="Advisors" />
              <NavLink path="/team" label="Team" />
              {isOwner && <NavLink path="/admin" label="Admin" />}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {isConnected ? (
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {getNetworkIcon()}
                {getNetworkName()}
              </span>
              <span className="text-sm font-mono px-3 py-1 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                {truncateAddress(address)}
              </span>
              <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 transition-all"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: '1px solid var(--destructive)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="hidden sm:flex items-center gap-2 btn-primary"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              <Wallet size={15} />
              Connect Wallet
            </button>
          )}
          {/* Mobile Navigation */}
          {isConnected && <MobileNav isConnected={isConnected} address={address} disconnect={disconnect} />}
        </div>
      </div>

      {/* Admin Submenu — shown only on /admin routes, owner only */}
      {isOwner && location.pathname.startsWith('/admin') && isConnected && (
        <div style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          {/* Admin Module Tabs */}
          <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {ADMIN_MODULES.map(({ path, label, color }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? color : 'transparent',
                    color: isActive ? '#000' : 'var(--foreground)',
                    border: isActive ? `1px solid ${color}` : '1px solid var(--border)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Admin Functions Info */}
          <div className="max-w-6xl mx-auto px-4 py-2 text-xs" style={{ color: '#A0AEC0' }}>
            <span>Admin Functions: Deposit • Withdraw • Funding Status • Settings • Genealogy</span>
          </div>

          {/* Wrap toggle drawer — mobile only */}
          <div className="md:hidden max-w-6xl mx-auto px-4 flex justify-end mb-2">
            <button
              onClick={() => setAdminTabsWrap(!adminTabsWrap)}
              title={adminTabsWrap ? "Click to collapse tabs" : "Click to expand tabs"}
              className="px-2 py-0.5 rounded-lg text-[9px] font-bold hover:opacity-80 active:scale-95 transition-all cursor-pointer select-none"
              style={{
                backgroundColor: 'var(--primary)',
                color: '#000',
                border: '1px solid var(--primary)',
              }}
            >
              {adminTabsWrap ? '━ Collapse' : '⊞ Expand'}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
