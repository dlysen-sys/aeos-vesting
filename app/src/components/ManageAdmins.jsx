import { useState } from 'react'
import { usePublicClient, useWalletClient, useAccount } from 'wagmi'
import { ADMIN_OWNABLE_ABI } from '../config/abis'
import { UserPlus, UserMinus, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import ContractButton from './ContractButton'

/**
 * ManageAdmins — reusable admin management panel for any AdminOwnable contract.
 *
 * @param {string}  contractAddress  The deployed contract address
 * @param {string}  accentColor      Tab highlight color (e.g. '#10B981')
 * @param {string}  contractName     Display label (e.g. 'Strategic')
 */
export default function ManageAdmins({ contractAddress, accentColor = 'var(--primary)', contractName = '' }) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [subTab, setSubTab]   = useState('add')   // 'add' | 'remove' | 'check'
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState({ type: '', text: '' })
  const [checkResult, setCheckResult] = useState(null)

  const reset = () => { setMsg({ type: '', text: '' }); setCheckResult(null) }

  const write = async (functionName, args) => {
    if (!walletClient) throw new Error('Wallet not connected')
    return walletClient.writeContract({
      account: address,
      address: contractAddress,
      abi: ADMIN_OWNABLE_ABI,
      functionName,
      args,
    })
  }

  const handleAdd = async () => {
    reset()
    if (!input) return setMsg({ type: 'error', text: 'Enter an address.' })
    try {
      setLoading(true)
      const hash = await write('addAdmin', [input])
      setMsg({ type: 'success', text: `Admin added. TX: ${hash}` })
      setInput('')
    } catch (e) {
      setMsg({ type: 'error', text: e.shortMessage || e.message })
    } finally { setLoading(false) }
  }

  const handleRemove = async () => {
    reset()
    if (!input) return setMsg({ type: 'error', text: 'Enter an address.' })
    try {
      setLoading(true)
      const hash = await write('removeAdmin', [input])
      setMsg({ type: 'success', text: `Admin removed. TX: ${hash}` })
      setInput('')
    } catch (e) {
      setMsg({ type: 'error', text: e.shortMessage || e.message })
    } finally { setLoading(false) }
  }

  const handleCheck = async () => {
    reset()
    if (!input) return setMsg({ type: 'error', text: 'Enter an address.' })
    try {
      setLoading(true)
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: ADMIN_OWNABLE_ABI,
        functionName: 'checkIsAdmin',
        args: [input],
      })
      setCheckResult({ address: input, isAdmin: result })
    } catch (e) {
      setMsg({ type: 'error', text: e.shortMessage || e.message })
    } finally { setLoading(false) }
  }

  const SUB_TABS = [
    { id: 'add',    label: 'Add Admin',    icon: UserPlus  },
    { id: 'remove', label: 'Remove Admin', icon: UserMinus },
    { id: 'check',  label: 'Check Admin',  icon: Search    },
  ]

  const handler   = subTab === 'add' ? handleAdd : subTab === 'remove' ? handleRemove : handleCheck
  const btnLabel  = subTab === 'add' ? 'Add Admin' : subTab === 'remove' ? 'Remove Admin' : 'Check'
  const btnIcon   = subTab === 'add' ? UserPlus : subTab === 'remove' ? UserMinus : Search
  const BtnIcon   = btnIcon

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {contractName} Admin Management
        </h4>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: accentColor + '20', color: accentColor }}>
          onlyOwner
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); reset() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: subTab === t.id ? accentColor : 'var(--muted)',
              color: subTab === t.id ? '#000' : 'var(--foreground)',
            }}>
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
          {subTab === 'check' ? 'Address to check' : `Address to ${subTab}`}
        </label>
        <input
          className="w-full p-3 rounded-lg border text-sm font-mono"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          placeholder="0x..."
          value={input}
          onChange={e => { setInput(e.target.value); reset() }}
        />
      </div>

      <ContractButton
        label={loading ? 'Processing...' : btnLabel}
        onClick={handler}
        disabled={loading || !input}
        variant="primary"
        fullWidth
        style={{ backgroundColor: accentColor, borderColor: accentColor, color: '#000' }}
      />

      {/* Check result */}
      {checkResult && (
        <div className="p-4 rounded-lg border flex items-center gap-3"
             style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
          {checkResult.isAdmin
            ? <CheckCircle size={20} style={{ color: '#10B981', flexShrink: 0 }} />
            : <XCircle    size={20} style={{ color: '#EF4444', flexShrink: 0 }} />}
          <div>
            <p className="text-sm font-medium">
              {checkResult.isAdmin ? 'Is an admin' : 'Not an admin'}
            </p>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {checkResult.address}
            </p>
          </div>
        </div>
      )}

      {/* Status message */}
      {msg.text && (
        <div className="p-3 rounded-lg flex items-start gap-2 text-sm"
             style={{
               backgroundColor: msg.type === 'error' ? '#EF444420' : '#10B98120',
               color: msg.type === 'error' ? '#EF4444' : '#10B981',
             }}>
          {msg.type === 'error'
            ? <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            : <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />}
          <span className="break-all">{msg.text}</span>
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Admins can call all <code style={{ fontSize: '11px' }}>onlyAdmin</code> functions on this contract.
        Only the owner can add or remove admins.
      </p>
    </div>
  )
}
