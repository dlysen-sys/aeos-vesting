import { usePublicClient, useWalletClient, useAccount } from 'wagmi'
import { CONTRACTS } from '../config/contracts'

// Genealogy ABI
const GENEALOGY_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getAffiliate',
    outputs: [
      { internalType: 'address', name: 'parent', type: 'address' },
      { internalType: 'uint256', name: 'directCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getAffiliateChildren',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getBinary',
    outputs: [
      { internalType: 'address', name: 'parent', type: 'address' },
      { internalType: 'address', name: 'leftAddr', type: 'address' },
      { internalType: 'address', name: 'rightAddr', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isUser',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'adminAddress', type: 'address' }],
    name: 'addAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'adminAddress', type: 'address' }],
    name: 'removeAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'checkIsAdmin',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'address', name: 'newParent', type: 'address' },
    ],
    name: 'updateAffiliateData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user',        type: 'address' },
      { internalType: 'address', name: 'newParent',   type: 'address' },
      { internalType: 'address', name: 'newLeftAddr', type: 'address' },
      { internalType: 'address', name: 'newRightAddr',type: 'address' },
      { internalType: 'uint256', name: 'newVolume',   type: 'uint256' },
    ],
    name: 'updateBinaryData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'binaryVolume',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Admin config setters
  {
    inputs: [{ internalType: 'uint256', name: 'depth', type: 'uint256' }],
    name: 'setMaxIteration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'secs', type: 'uint256' }],
    name: 'setTransactionCooldown',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'max', type: 'uint256' }],
    name: 'setMaxAffiliateChildren',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Admin user management
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'bool',    name: 'newIsUserValue', type: 'bool' },
    ],
    name: 'updateIsUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Paginated children
  {
    inputs: [
      { internalType: 'address', name: 'user',   type: 'address' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit',  type: 'uint256' },
    ],
    name: 'getAffiliateChildrenPaginated',
    outputs: [
      { internalType: 'address[]', name: 'result', type: 'address[]' },
      { internalType: 'uint256',   name: 'total',  type: 'uint256'   },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // State reads
  {
    inputs: [],
    name: 'totalUsers',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxIteration',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxAffiliateChildren',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'transactionCooldown',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'admin', type: 'address' }],
    name: 'AdminAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'admin', type: 'address' }],
    name: 'AdminRemoved',
    type: 'event',
  },
]

export function useAeosGenealogy() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()

  // READ: Get affiliate info (sponsor + direct count)
  const getAffiliate = async (userAddress) => {
    if (!publicClient) return null
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'getAffiliate',
        args: [userAddress],
      })
      console.log('[Genealogy] Affiliate for', userAddress, ':', result)
      return { parent: result[0], directCount: Number(result[1]) }
    } catch (err) {
      console.error('[Genealogy] Error getting affiliate:', err)
      throw err
    }
  }

  // READ: Get affiliate children
  const getAffiliateChildren = async (userAddress) => {
    if (!publicClient) return []
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'getAffiliateChildren',
        args: [userAddress],
      })
      console.log('[Genealogy] Children for', userAddress, ':', result)
      return result
    } catch (err) {
      console.error('[Genealogy] Error getting children:', err)
      throw err
    }
  }

  // READ: Get binary tree info
  const getBinary = async (userAddress) => {
    if (!publicClient) return null
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'getBinary',
        args: [userAddress],
      })
      console.log('[Genealogy] Binary for', userAddress, ':', result)
      return { parent: result[0], leftAddr: result[1], rightAddr: result[2] }
    } catch (err) {
      console.error('[Genealogy] Error getting binary:', err)
      throw err
    }
  }

  // READ: Check if user is registered
  const isUserRegistered = async (userAddress) => {
    if (!publicClient) return false
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'isUser',
        args: [userAddress],
      })
      console.log('[Genealogy] User registered:', userAddress, result)
      return result
    } catch (err) {
      console.error('[Genealogy] Error checking user:', err)
      throw err
    }
  }

  // READ: Check if admin
  const checkIsAdmin = async (userAddress) => {
    if (!publicClient) return false
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'checkIsAdmin',
        args: [userAddress],
      })
      return result
    } catch (err) {
      console.error('[Genealogy] Error checking admin:', err)
      return false
    }
  }

  // WRITE: Add Admin
  const addAdmin = async (adminAddress) => {
    if (!walletClient) throw new Error('Wallet not connected')
    if (!address) throw new Error('No account connected')

    try {
      console.log('[Genealogy] Adding admin:', adminAddress)
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'addAdmin',
        args: [adminAddress],
      })
      console.log('[Genealogy] Add admin TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error adding admin:', err)
      throw err
    }
  }

  // WRITE: Remove Admin
  const removeAdmin = async (adminAddress) => {
    if (!walletClient) throw new Error('Wallet not connected')
    if (!address) throw new Error('No account connected')

    try {
      console.log('[Genealogy] Removing admin:', adminAddress)
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'removeAdmin',
        args: [adminAddress],
      })
      console.log('[Genealogy] Remove admin TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error removing admin:', err)
      throw err
    }
  }

  // WRITE: Update Affiliate Data
  const updateAffiliateData = async (user, newParent) => {
    if (!walletClient) throw new Error('Wallet not connected')
    if (!address) throw new Error('No account connected')

    try {
      console.log('[Genealogy] Updating affiliate:', user, 'to parent:', newParent)
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'updateAffiliateData',
        args: [user, newParent],
      })
      console.log('[Genealogy] Update affiliate TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error updating affiliate:', err)
      throw err
    }
  }

  // WRITE: Update Binary Data
  const updateBinaryData = async (user, newParent, newLeft, newRight, newVolume = 0n) => {
    if (!walletClient) throw new Error('Wallet not connected')
    if (!address) throw new Error('No account connected')

    try {
      console.log('[Genealogy] Updating binary:', user, 'volume:', newVolume.toString())
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'updateBinaryData',
        args: [user, newParent, newLeft, newRight, newVolume],
      })
      console.log('[Genealogy] Update binary TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error updating binary:', err)
      throw err
    }
  }

  // READ: Paginated children
  const getAffiliateChildrenPaginated = async (userAddress, offset = 0, limit = 50) => {
    if (!publicClient) return { result: [], total: 0 }
    try {
      const result = await publicClient.readContract({
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'getAffiliateChildrenPaginated',
        args: [userAddress, BigInt(offset), BigInt(limit)],
      })
      return { result: result[0], total: Number(result[1]) }
    } catch (err) {
      console.error('[Genealogy] Error getting paginated children:', err)
      throw err
    }
  }

  // READ: Stats (totalUsers, maxIteration, maxAffiliateChildren, cooldown)
  const getStats = async () => {
    if (!publicClient) return null
    try {
      const [totalUsers, maxIter, maxChildren, cooldown] = await Promise.all([
        publicClient.readContract({ address: CONTRACTS.genealogy, abi: GENEALOGY_ABI, functionName: 'totalUsers' }),
        publicClient.readContract({ address: CONTRACTS.genealogy, abi: GENEALOGY_ABI, functionName: 'maxIteration' }),
        publicClient.readContract({ address: CONTRACTS.genealogy, abi: GENEALOGY_ABI, functionName: 'maxAffiliateChildren' }),
        publicClient.readContract({ address: CONTRACTS.genealogy, abi: GENEALOGY_ABI, functionName: 'transactionCooldown' }),
      ])
      return {
        totalUsers: Number(totalUsers),
        maxIteration: Number(maxIter),
        maxAffiliateChildren: Number(maxChildren),
        transactionCooldown: Number(cooldown),
      }
    } catch (err) {
      console.error('[Genealogy] Error getting stats:', err)
      throw err
    }
  }

  // WRITE: Update user registration status
  const updateIsUser = async (userAddress, value) => {
    if (!walletClient) throw new Error('Wallet not connected')
    try {
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'updateIsUser',
        args: [userAddress, value],
      })
      console.log('[Genealogy] updateIsUser TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error updateIsUser:', err)
      throw err
    }
  }

  // WRITE: Set max iteration depth
  const setMaxIteration = async (depth) => {
    if (!walletClient) throw new Error('Wallet not connected')
    try {
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'setMaxIteration',
        args: [BigInt(depth)],
      })
      console.log('[Genealogy] setMaxIteration TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error setMaxIteration:', err)
      throw err
    }
  }

  // WRITE: Set transaction cooldown
  const setTransactionCooldown = async (seconds) => {
    if (!walletClient) throw new Error('Wallet not connected')
    try {
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'setTransactionCooldown',
        args: [BigInt(seconds)],
      })
      console.log('[Genealogy] setTransactionCooldown TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error setTransactionCooldown:', err)
      throw err
    }
  }

  // WRITE: Set max affiliate children
  const setMaxAffiliateChildren = async (max) => {
    if (!walletClient) throw new Error('Wallet not connected')
    try {
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.genealogy,
        abi: GENEALOGY_ABI,
        functionName: 'setMaxAffiliateChildren',
        args: [BigInt(max)],
      })
      console.log('[Genealogy] setMaxAffiliateChildren TX:', tx)
      return tx
    } catch (err) {
      console.error('[Genealogy] Error setMaxAffiliateChildren:', err)
      throw err
    }
  }

  return {
    // Reads
    getAffiliate,
    getAffiliateChildren,
    getAffiliateChildrenPaginated,
    getBinary,
    isUserRegistered,
    checkIsAdmin,
    getStats,
    // Admin writes
    addAdmin,
    removeAdmin,
    updateAffiliateData,
    updateBinaryData,
    updateIsUser,
    setMaxIteration,
    setTransactionCooldown,
    setMaxAffiliateChildren,
  }
}
