import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import Navbar from './components/Navbar'
import NetworkChainAlert from './components/NetworkChainAlert'
import Dashboard from './pages/Dashboard'
import Strategic from './pages/Strategic'
import Advisors from './pages/Advisors'
import Team from './pages/Team'
import AdminStrategic from './pages/AdminStrategic'
import AdminAdvisors from './pages/AdminAdvisors'
import AdminTeam from './pages/AdminTeam'
import AdminGenealogy from './pages/AdminGenealogy'
import Landing from './pages/Landing'
import './styles/globals.css'

export default function App() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <Router>
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <NetworkChainAlert />
        <Navbar isConnected={isConnected} address={address} disconnect={disconnect} connect={() => connect({ connector: injected() })} />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing isConnected={isConnected} connect={() => connect({ connector: injected() })} />} />

          {/* Protected Routes - User Dashboards */}
          <Route path="/strategic" element={isConnected ? <Strategic /> : <Navigate to="/" />} />
          <Route path="/advisor" element={isConnected ? <Advisors /> : <Navigate to="/" />} />
          <Route path="/team" element={isConnected ? <Team /> : <Navigate to="/" />} />

          {/* Admin Routes - Owner Only */}
          <Route path="/admin" element={isConnected ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/admin/strategic" element={isConnected ? <AdminStrategic /> : <Navigate to="/" />} />
          <Route path="/admin/advisor" element={isConnected ? <AdminAdvisors /> : <Navigate to="/" />} />
          <Route path="/admin/team" element={isConnected ? <AdminTeam /> : <Navigate to="/" />} />
          <Route path="/admin/genealogy" element={isConnected ? <AdminGenealogy /> : <Navigate to="/" />} />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}
