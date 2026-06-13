/**
 * Smart Contract ABIs for AEOS Vesting
 */

// ERC20 Standard ABI (for AEOS & USDT tokens) - Updated for Wagmi v2
export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// AEOS Vesting Team ABI
export const AEOS_VESTING_TEAM_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'member', type: 'address' }],
    name: 'assignTeamMember',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'depositTeamTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'releaseTeamTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'member', type: 'address' }],
    name: 'getClaimableAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// AEOS Vesting Strategic ABI
export const AEOS_VESTING_STRATEGIC_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'usdtAmount', type: 'uint256' }],
    name: 'buyStrategicVesting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'investmentIndex', type: 'uint256' }],
    name: 'releaseStrategicTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }, { internalType: 'uint256', name: 'investmentIndex', type: 'uint256' }],
    name: 'getClaimableAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }],
    name: 'getInvestorSummary',
    outputs: [
      { internalType: 'uint256', name: 'totalPurchased', type: 'uint256' },
      { internalType: 'uint256', name: 'totalReleased', type: 'uint256' },
      { internalType: 'uint256', name: 'totalClaimable', type: 'uint256' },
      { internalType: 'uint256', name: 'investmentCount', type: 'uint256' },
      { internalType: 'uint256', name: 'completedCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'investor', type: 'address' }, { internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getInvestmentDetails',
    outputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'released', type: 'uint256' },
      { internalType: 'uint256', name: 'claimable', type: 'uint256' },
      { internalType: 'uint256', name: 'purchaseTime', type: 'uint256' },
      { internalType: 'uint256', name: 'releasedTime', type: 'uint256' },
      { internalType: 'uint256', name: 'cliffEnd', type: 'uint256' },
      { internalType: 'uint256', name: 'vestingEnd', type: 'uint256' },
      { internalType: 'bool', name: 'isCompleted', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'depositStrategicTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawAEOS',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawUSDT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Owner Vesting Management
  {
    inputs: [
      { internalType: 'address', name: 'user',      type: 'address' },
      { internalType: 'uint256', name: 'amount',    type: 'uint256' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'addStrategicVesting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user',  type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
      {
        internalType: 'tuple',
        name: 'u',
        type: 'tuple',
        components: [
          { internalType: 'uint256', name: 'amount',       type: 'uint256' },
          { internalType: 'uint256', name: 'released',     type: 'uint256' },
          { internalType: 'uint256', name: 'purchaseTime', type: 'uint256' },
          { internalType: 'uint256', name: 'releasedTime', type: 'uint256' },
          { internalType: 'uint256', name: 'cliffEnd',     type: 'uint256' },
          { internalType: 'uint256', name: 'vestingEnd',   type: 'uint256' },
          { internalType: 'bool',    name: 'isCompleted',  type: 'bool'    },
        ],
      },
    ],
    name: 'updateStrategicVesting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Funding Monitoring Functions (Phase 3)
  {
    inputs: [],
    name: 'getFundingStatus',
    outputs: [
      { internalType: 'uint256', name: 'totalPromised', type: 'uint256' },
      { internalType: 'uint256', name: 'deposited', type: 'uint256' },
      { internalType: 'uint256', name: 'stillClaimable', type: 'uint256' },
      { internalType: 'uint256', name: 'fundingGap', type: 'uint256' },
      { internalType: 'bool', name: 'isFunded', type: 'bool' },
      { internalType: 'uint256', name: 'percentageFunded', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFundingBreakdown',
    outputs: [
      { internalType: 'uint256', name: 'totalPurchased', type: 'uint256' },
      { internalType: 'uint256', name: 'availableBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'allocatedBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'surplusOrDeficit', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getBalanceStatus',
    outputs: [
      { internalType: 'uint256', name: 'contractBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'allocated', type: 'uint256' },
      { internalType: 'uint256', name: 'deposited', type: 'uint256' },
      { internalType: 'uint256', name: 'withdrawnByUsers', type: 'uint256' },
      { internalType: 'uint256', name: 'withdrawnByOwner', type: 'uint256' },
      { internalType: 'bool', name: 'hasEnoughBalance', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'canWithdrawAmount',
    outputs: [
      { internalType: 'bool', name: 'canWithdraw', type: 'bool' },
      { internalType: 'uint256', name: 'availableAmount', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Owner-only Configuration Functions
  {
    inputs: [{ internalType: 'address', name: '_newTreasury', type: 'address' }],
    name: 'setTreasuryWallet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_liquidityAddress', type: 'address' }],
    name: 'setLiquidityContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawUsdt',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'newVestingPrice', type: 'uint256' },
      { internalType: 'uint256', name: 'newMinInvestment', type: 'uint256' },
      { internalType: 'uint256', name: 'newCliffMonths', type: 'uint256' },
      { internalType: 'uint256', name: 'newUnlockPercent', type: 'uint256' },
      { internalType: 'uint256', name: 'newVestingMonths', type: 'uint256' },
      { internalType: 'uint256', name: 'newWithdrawalPeriod', type: 'uint256' },
    ],
    name: 'setVestingConfiguration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'newSlippageBps', type: 'uint256' }],
    name: 'setSlippageTolerance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'newLiquidityBps', type: 'uint256' },
      { internalType: 'uint256', name: 'newTreasuryBps', type: 'uint256' },
    ],
    name: 'setUsdtSplitBps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Configuration Getter Functions (Read-Only)
  {
    inputs: [],
    name: 'cliffPeriodSeconds',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unlockPercentPerPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'vestingEndSeconds',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawalPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'slippageBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdtToLiquidityBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdtToTreasuryBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasuryWallet',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ========== TIERED PRICING (STRICT TYPE DISCIPLINE) ==========
  // All uint256 parameters are in wei (18 decimals) - NO conversions inside contract
  // Frontend MUST multiply by 1e18 before calling
  {
    inputs: [{ internalType: 'uint256', name: 'usdtAmountWei', type: 'uint256' }],
    name: 'getPriceForAmount',
    outputs: [{ internalType: 'uint256', name: 'priceWei', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Tiered Pricing Setters - All inputs in wei (18 decimals)
  {
    inputs: [
      { internalType: 'uint256', name: 'newMaxUSDTWei', type: 'uint256' },
      { internalType: 'uint256', name: 'newPriceWei', type: 'uint256' },
    ],
    name: 'setTier1Pricing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'newMaxUSDTWei', type: 'uint256' },
      { internalType: 'uint256', name: 'newPriceWei', type: 'uint256' },
    ],
    name: 'setTier2Pricing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'newMaxUSDTWei', type: 'uint256' },
      { internalType: 'uint256', name: 'newPriceWei', type: 'uint256' },
    ],
    name: 'setTier3Pricing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'newPriceWei', type: 'uint256' }],
    name: 'setTier4Price',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Tiered Pricing Getters - All returns in wei (18 decimals)
  {
    inputs: [],
    name: 'tier1MaxUSDTWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tier1PriceWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tier2MaxUSDTWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tier2PriceWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tier3MaxUSDTWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tier3PriceWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tier4PriceWei',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// AEOS Vesting Advisors ABI
export const AEOS_VESTING_ADVISORS_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'usdtAmount', type: 'uint256' }],
    name: 'buyAdvisorVesting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'investmentIndex', type: 'uint256' }],
    name: 'releaseAdvisorTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'advisor', type: 'address' }, { internalType: 'uint256', name: 'investmentIndex', type: 'uint256' }],
    name: 'getClaimableAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'advisor', type: 'address' }],
    name: 'getUserInvestmentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// AEOS Vesting Reserves ABI
export const AEOS_VESTING_RESERVES_ABI = [
  {
    inputs: [],
    name: 'getTreasuryBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLiquidityBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCommunityBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]
