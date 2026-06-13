import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useAeosGenealogy } from '../hooks/useAeosGenealogy'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Users, UserPlus, UserMinus, Settings, ToggleLeft } from 'lucide-react'

export default function AdminGenealogy() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const genealogy = useAeosGenealogy()

  // State for Check User tab
  const [userToCheck, setUserToCheck] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  // State for Admin Management tab
  const [adminAddress, setAdminAddress] = useState('')
  const [adminAction, setAdminAction] = useState('add') // 'add' or 'remove'
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')

  // State for Affiliate Update tab
  const [affUser, setAffUser] = useState('')
  const [affNewParent, setAffNewParent] = useState('')
  const [affLoading, setAffLoading] = useState(false)
  const [affError, setAffError] = useState('')
  const [affSuccess, setAffSuccess] = useState('')

  // State for Binary Update tab
  const [binUser, setBinUser] = useState('')
  const [binParent, setBinParent] = useState('')
  const [binLeft, setBinLeft] = useState('')
  const [binRight, setBinRight] = useState('')
  const [binVolume, setBinVolume] = useState('')
  const [binLoading, setBinLoading] = useState(false)
  const [binError, setBinError] = useState('')
  const [binSuccess, setBinSuccess] = useState('')

  // State for User Status tab
  const [statusUser, setStatusUser] = useState('')
  const [statusValue, setStatusValue] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  // State for Settings tab
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [maxIter, setMaxIter] = useState('')
  const [cooldown, setCooldown] = useState('')
  const [maxChildren, setMaxChildren] = useState('')
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' })
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState('check')

  // Auto-load stats when settings tab is opened
  useEffect(() => {
    if (activeTab === 'settings') {
      setStatsLoading(true)
      genealogy.getStats()
        .then(s => { setStats(s); setMaxIter(String(s.maxIteration)); setCooldown(String(s.transactionCooldown)); setMaxChildren(String(s.maxAffiliateChildren)) })
        .catch(() => {})
        .finally(() => setStatsLoading(false))
    }
  }, [activeTab])

  // ============ CHECK USER TAB ============

  const handleCheckUser = async () => {
    setUserLoading(true)
    setUserError('')
    setUserInfo(null)

    try {
      if (!userToCheck) throw new Error('Enter a user address')

      const isReg = await genealogy.isUserRegistered(userToCheck)
      const affiliate = await genealogy.getAffiliate(userToCheck)
      const binary = await genealogy.getBinary(userToCheck)
      const isAdm = await genealogy.checkIsAdmin(userToCheck)

      setUserInfo({
        address: userToCheck,
        isRegistered: isReg,
        affiliate,
        binary,
        isAdmin: isAdm,
      })
    } catch (err) {
      console.error('[UI] Error checking user:', err)
      setUserError(err.message || 'Failed to check user')
    } finally {
      setUserLoading(false)
    }
  }

  // ============ ADMIN MANAGEMENT TAB ============

  const handleAddAdmin = async () => {
    setAdminLoading(true)
    setAdminError('')
    setAdminSuccess('')

    try {
      if (!adminAddress) throw new Error('Enter admin address')

      const tx = await genealogy.addAdmin(adminAddress)
      console.log('[UI] Add admin TX:', tx)

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
        console.log('[UI] Add admin confirmed')
      }

      setAdminSuccess(`✅ Admin added: ${adminAddress}`)
      setAdminAddress('')

      setTimeout(() => setAdminSuccess(''), 5000)
    } catch (err) {
      console.error('[UI] Error adding admin:', err)
      setAdminError(err.message || 'Failed to add admin')
    } finally {
      setAdminLoading(false)
    }
  }

  const handleRemoveAdmin = async () => {
    setAdminLoading(true)
    setAdminError('')
    setAdminSuccess('')

    try {
      if (!adminAddress) throw new Error('Enter admin address')

      const tx = await genealogy.removeAdmin(adminAddress)
      console.log('[UI] Remove admin TX:', tx)

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
        console.log('[UI] Remove admin confirmed')
      }

      setAdminSuccess(`✅ Admin removed: ${adminAddress}`)
      setAdminAddress('')

      setTimeout(() => setAdminSuccess(''), 5000)
    } catch (err) {
      console.error('[UI] Error removing admin:', err)
      setAdminError(err.message || 'Failed to remove admin')
    } finally {
      setAdminLoading(false)
    }
  }

  // ============ AFFILIATE UPDATE TAB ============

  const handleUpdateAffiliate = async () => {
    setAffLoading(true)
    setAffError('')
    setAffSuccess('')

    try {
      if (!affUser) throw new Error('Enter user address')
      if (!affNewParent) throw new Error('Enter new parent address')

      const tx = await genealogy.updateAffiliateData(affUser, affNewParent)
      console.log('[UI] Update affiliate TX:', tx)

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
        console.log('[UI] Update affiliate confirmed')
      }

      setAffSuccess(`✅ Affiliate updated: ${affUser}`)
      setAffUser('')
      setAffNewParent('')

      setTimeout(() => setAffSuccess(''), 5000)
    } catch (err) {
      console.error('[UI] Error updating affiliate:', err)
      setAffError(err.message || 'Failed to update affiliate')
    } finally {
      setAffLoading(false)
    }
  }

  // ============ BINARY UPDATE TAB ============

  const handleUpdateBinary = async () => {
    setBinLoading(true)
    setBinError('')
    setBinSuccess('')

    try {
      if (!binUser) throw new Error('Enter user address')

      const tx = await genealogy.updateBinaryData(
        binUser,
        binParent || '0x0000000000000000000000000000000000000000',
        binLeft   || '0x0000000000000000000000000000000000000000',
        binRight  || '0x0000000000000000000000000000000000000000',
        binVolume ? BigInt(binVolume) : 0n
      )
      console.log('[UI] Update binary TX:', tx)

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
        console.log('[UI] Update binary confirmed')
      }

      setBinSuccess(`✅ Binary updated: ${binUser}`)
      setBinVolume('')
      setBinUser('')
      setBinParent('')
      setBinLeft('')
      setBinRight('')

      setTimeout(() => setBinSuccess(''), 5000)
    } catch (err) {
      console.error('[UI] Error updating binary:', err)
      setBinError(err.message || 'Failed to update binary')
    } finally {
      setBinLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Genealogy Management</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('check')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'check'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Check User
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'admin'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Manage Admins
        </button>
        <button
          onClick={() => setActiveTab('affiliate')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'affiliate'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Update Affiliate
        </button>
        <button
          onClick={() => setActiveTab('binary')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'binary'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Update Binary
        </button>
        <button
          onClick={() => setActiveTab('userstatus')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'userstatus'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ToggleLeft className="w-4 h-4 inline mr-2" />
          User Status
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 font-medium whitespace-nowrap ${
            activeTab === 'settings'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
      </div>

      {/* CHECK USER TAB */}
      {activeTab === 'check' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Check User Registration & Info</h3>

          <div className="space-y-3">
            <label className="block text-gray-300 text-sm font-medium">User Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={userToCheck}
              onChange={(e) => setUserToCheck(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <button
              onClick={handleCheckUser}
              disabled={userLoading || !userToCheck}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {userLoading ? 'Checking...' : 'Check User'}
            </button>
          </div>

          {userError && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{userError}</p>
            </div>
          )}

          {userInfo && (
            <div className="p-4 bg-gray-800 rounded space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Registered:</span>
                {userInfo.isRegistered ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-medium">
                  {userInfo.isRegistered ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Admin:</span>
                {userInfo.isAdmin ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-medium">{userInfo.isAdmin ? 'Yes' : 'No'}</span>
              </div>

              <div className="text-sm space-y-2">
                <p>
                  <span className="text-gray-400">Sponsor:</span>
                  <span className="text-yellow-300 ml-2 font-mono text-xs">
                    {userInfo.affiliate?.parent === '0x0000000000000000000000000000000000000000'
                      ? 'None'
                      : userInfo.affiliate?.parent || 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Direct Children:</span>
                  <span className="text-white ml-2 font-medium">{userInfo.affiliate?.directCount || 0}</span>
                </p>
                <p>
                  <span className="text-gray-400">Binary Parent:</span>
                  <span className="text-yellow-300 ml-2 font-mono text-xs">
                    {userInfo.binary?.parent === '0x0000000000000000000000000000000000000000'
                      ? 'None'
                      : userInfo.binary?.parent || 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Left Child:</span>
                  <span className="text-yellow-300 ml-2 font-mono text-xs">
                    {userInfo.binary?.leftAddr === '0x0000000000000000000000000000000000000000'
                      ? 'Empty'
                      : userInfo.binary?.leftAddr || 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Right Child:</span>
                  <span className="text-yellow-300 ml-2 font-mono text-xs">
                    {userInfo.binary?.rightAddr === '0x0000000000000000000000000000000000000000'
                      ? 'Empty'
                      : userInfo.binary?.rightAddr || 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Binary Volume:</span>
                  <span className="text-cyan-300 ml-2 font-mono text-xs">
                    {userInfo.binary?.volume !== undefined
                      ? Number(userInfo.binary.volume).toLocaleString()
                      : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANAGE ADMINS TAB */}
      {activeTab === 'admin' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Add or Remove Admins</h3>

          <div className="space-y-3">
            <label className="block text-gray-300 text-sm font-medium">Admin Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={adminAddress}
              onChange={(e) => setAdminAddress(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <div className="flex gap-3">
              <button
                onClick={handleAddAdmin}
                disabled={adminLoading || !adminAddress}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {adminLoading && adminAction === 'add' ? 'Adding...' : 'Add Admin'}
              </button>
              <button
                onClick={handleRemoveAdmin}
                disabled={adminLoading || !adminAddress}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserMinus className="w-4 h-4" />
                {adminLoading && adminAction === 'remove' ? 'Removing...' : 'Remove Admin'}
              </button>
            </div>
          </div>

          {adminError && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{adminError}</p>
            </div>
          )}

          {adminSuccess && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{adminSuccess}</p>
            </div>
          )}

          <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded">
            <p className="text-sm text-blue-300">
              ℹ️ Only the contract owner can add or remove admins. Admins can perform migration tasks and update genealogy data.
            </p>
          </div>
        </div>
      )}

      {/* UPDATE AFFILIATE TAB */}
      {activeTab === 'affiliate' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Update Affiliate (Sponsor)</h3>

          <div className="space-y-3">
            <label className="block text-gray-300 text-sm font-medium">User Address</label>
            <input
              type="text"
              placeholder="User to update"
              value={affUser}
              onChange={(e) => setAffUser(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <label className="block text-gray-300 text-sm font-medium">New Parent (Sponsor)</label>
            <input
              type="text"
              placeholder="New sponsor address"
              value={affNewParent}
              onChange={(e) => setAffNewParent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <button
              onClick={handleUpdateAffiliate}
              disabled={affLoading || !affUser || !affNewParent}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {affLoading ? 'Updating...' : 'Update Affiliate'}
            </button>
          </div>

          {affError && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{affError}</p>
            </div>
          )}

          {affSuccess && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{affSuccess}</p>
            </div>
          )}

          <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded">
            <p className="text-sm text-blue-300">
              ⚠️ This operation removes the user from old parent's children and adds to new parent. Use for migration/corrections only.
            </p>
          </div>
        </div>
      )}

      {/* UPDATE BINARY TAB */}
      {activeTab === 'binary' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Update Binary Tree Placement</h3>

          <div className="space-y-3">
            <label className="block text-gray-300 text-sm font-medium">User Address</label>
            <input
              type="text"
              placeholder="User to update"
              value={binUser}
              onChange={(e) => setBinUser(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <label className="block text-gray-300 text-sm font-medium">Binary Parent (leave empty for none)</label>
            <input
              type="text"
              placeholder="0x... or empty"
              value={binParent}
              onChange={(e) => setBinParent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <label className="block text-gray-300 text-sm font-medium">Left Child (leave empty for none)</label>
            <input
              type="text"
              placeholder="0x... or empty"
              value={binLeft}
              onChange={(e) => setBinLeft(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <label className="block text-gray-300 text-sm font-medium">Right Child (leave empty for none)</label>
            <input
              type="text"
              placeholder="0x... or empty"
              value={binRight}
              onChange={(e) => setBinRight(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <label className="block text-gray-300 text-sm font-medium mt-2">
              Binary Volume — leave empty to keep current value
            </label>
            <input
              type="number"
              placeholder="e.g. 5000 (leave empty = no change)"
              value={binVolume}
              onChange={(e) => setBinVolume(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-500">
              Used by the tree traversal to determine the lesser-volume leg.
              0 = no volume assigned yet.
            </p>

            <button
              onClick={handleUpdateBinary}
              disabled={binLoading || !binUser}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {binLoading ? 'Updating...' : 'Update Binary'}
            </button>
          </div>

          {binError && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{binError}</p>
            </div>
          )}

          {binSuccess && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{binSuccess}</p>
            </div>
          )}

          <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded">
            <p className="text-sm text-blue-300">
              ⚠️ Updates binary tree positions (parent, left child, right child). Use for migration/tree rebalancing.
            </p>
          </div>
        </div>
      )}
      {/* USER STATUS TAB */}
      {activeTab === 'userstatus' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Enable / Disable User Registration</h3>
          <p className="text-sm text-gray-400">
            Toggle whether an address is treated as a registered user. Disabling does not clear tree data.
          </p>

          <div className="space-y-3">
            <label className="block text-gray-300 text-sm font-medium">User Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={statusUser}
              onChange={e => setStatusUser(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStatusValue(true)}
                className={`flex-1 py-2 rounded font-medium transition-colors ${statusValue ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Enable (isUser = true)
              </button>
              <button
                onClick={() => setStatusValue(false)}
                className={`flex-1 py-2 rounded font-medium transition-colors ${!statusValue ? 'bg-red-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Disable (isUser = false)
              </button>
            </div>

            <button
              onClick={async () => {
                setStatusMsg({ type: '', text: '' })
                if (!statusUser) return setStatusMsg({ type: 'error', text: 'Address is required.' })
                try {
                  setStatusLoading(true)
                  const tx = await genealogy.updateIsUser(statusUser, statusValue)
                  setStatusMsg({ type: 'success', text: `User ${statusValue ? 'enabled' : 'disabled'}. TX: ${tx}` })
                  setStatusUser('')
                } catch (err) {
                  setStatusMsg({ type: 'error', text: err.shortMessage || err.message })
                } finally { setStatusLoading(false) }
              }}
              disabled={statusLoading || !statusUser}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ToggleLeft className="w-4 h-4" />
              {statusLoading ? 'Processing...' : 'Apply Status Change'}
            </button>
          </div>

          {statusMsg.text && (
            <div className={`p-4 rounded flex items-start gap-3 ${statusMsg.type === 'error' ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}>
              {statusMsg.type === 'error'
                ? <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                : <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
              <p className={`text-sm ${statusMsg.type === 'error' ? 'text-red-300' : 'text-green-300'}`}>{statusMsg.text}</p>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">Network Configuration</h3>

          {/* Current stats */}
          {statsLoading && <p className="text-sm text-gray-400">Loading current settings...</p>}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Users', value: stats.totalUsers },
                { label: 'Max Iteration', value: stats.maxIteration },
                { label: 'Max Children', value: stats.maxAffiliateChildren === 0 ? 'Unlimited' : stats.maxAffiliateChildren },
                { label: 'Cooldown (s)', value: stats.transactionCooldown },
              ].map(s => (
                <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-yellow-400">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {settingsMsg.text && (
            <div className={`p-3 rounded text-sm ${settingsMsg.type === 'error' ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
              {settingsMsg.text}
            </div>
          )}

          {/* Max Iteration */}
          <div className="space-y-2">
            <label className="block text-gray-300 text-sm font-medium">Max Tree Traversal Depth (1–1000)</label>
            <div className="flex gap-2">
              <input type="number" value={maxIter} onChange={e => setMaxIter(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="100" />
              <button onClick={async () => {
                try { setSettingsLoading(true); const tx = await genealogy.setMaxIteration(Number(maxIter)); setSettingsMsg({ type: 'success', text: `Max iteration updated. TX: ${tx}` }) }
                catch (e) { setSettingsMsg({ type: 'error', text: e.shortMessage || e.message }) }
                finally { setSettingsLoading(false) }
              }} disabled={settingsLoading} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium disabled:opacity-50">
                Update
              </button>
            </div>
          </div>

          {/* Transaction Cooldown */}
          <div className="space-y-2">
            <label className="block text-gray-300 text-sm font-medium">Transaction Cooldown (seconds, max 300)</label>
            <div className="flex gap-2">
              <input type="number" value={cooldown} onChange={e => setCooldown(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="9" />
              <button onClick={async () => {
                try { setSettingsLoading(true); const tx = await genealogy.setTransactionCooldown(Number(cooldown)); setSettingsMsg({ type: 'success', text: `Cooldown updated. TX: ${tx}` }) }
                catch (e) { setSettingsMsg({ type: 'error', text: e.shortMessage || e.message }) }
                finally { setSettingsLoading(false) }
              }} disabled={settingsLoading} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium disabled:opacity-50">
                Update
              </button>
            </div>
          </div>

          {/* Max Affiliate Children */}
          <div className="space-y-2">
            <label className="block text-gray-300 text-sm font-medium">Max Affiliate Children per Sponsor (0 = unlimited)</label>
            <div className="flex gap-2">
              <input type="number" value={maxChildren} onChange={e => setMaxChildren(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="0" />
              <button onClick={async () => {
                try { setSettingsLoading(true); const tx = await genealogy.setMaxAffiliateChildren(Number(maxChildren)); setSettingsMsg({ type: 'success', text: `Max children updated. TX: ${tx}` }) }
                catch (e) { setSettingsMsg({ type: 'error', text: e.shortMessage || e.message }) }
                finally { setSettingsLoading(false) }
              }} disabled={settingsLoading} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium disabled:opacity-50">
                Update
              </button>
            </div>
            <p className="text-xs text-gray-500">Setting to 0 removes the cap entirely. Changes take effect on next registration.</p>
          </div>
        </div>
      )}

    </div>
    </div>
  )
}
