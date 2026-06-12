# ContractButton Component Usage Guide

Uniform button component for all smart contract interactions with consistent error/success feedback.

## Basic Usage

```jsx
import ContractButton from './ContractButton'

function MyComponent() {
  const handleTransaction = async () => {
    // Your async smart contract call here
    const result = await myContract.someFunction()
    
    // Return optional custom message
    return { message: '✅ Custom success message!' }
  }

  return (
    <ContractButton
      label="Execute Transaction"
      onClick={handleTransaction}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | required | Button text |
| `onClick` | async function | required | Async handler (must return Promise or throw Error) |
| `disabled` | boolean | false | Disable button |
| `variant` | string | 'primary' | Style variant: primary, success, danger, secondary |
| `size` | string | 'md' | Button size: sm, md, lg |
| `fullWidth` | boolean | false | Stretch to full width |
| `className` | string | '' | Additional Tailwind classes |
| `onSuccess` | function | null | Callback after successful transaction (for refetching, etc.) |

## Variants

All variants use **transparent backgrounds with alpha channel** for light/dark mode compatibility:

```jsx
// Primary (yellow) - for main actions
<ContractButton label="Claim Tokens" variant="primary" onClick={handleClaim} />

// Success (green) - for positive actions
<ContractButton label="Approve" variant="success" onClick={handleApprove} />

// Danger (red) - for destructive actions
<ContractButton label="Revoke" variant="danger" onClick={handleRevoke} />

// Secondary (gray) - for secondary actions
<ContractButton label="View Details" variant="secondary" onClick={handleView} />
```

**Styling:** Transparent background (20% opacity) with subtle borders. Auto-adjusts text color for light/dark modes using Tailwind's `dark:` prefix.

## Size Variants

```jsx
<ContractButton label="Small" size="sm" onClick={handler} />
<ContractButton label="Medium" size="md" onClick={handler} />
<ContractButton label="Large" size="lg" onClick={handler} />
```

## Full Width

```jsx
<ContractButton label="Full Width Button" fullWidth onClick={handler} />
```

## Features

✅ **Automatic Loading State** — Shows "⏳ Processing..." while async call runs  
✅ **Error Handling** — Catches errors and displays below button  
✅ **Success Messages** — Shows custom or default success message  
✅ **Auto-Clear** — Messages disappear after 5 seconds  
✅ **Consistent Styling** — Same look across entire app  
✅ **Responsive Feedback** — Messages appear with smooth animation  
✅ **Light/Dark Mode** — Transparent backgrounds adapt to any theme  
✅ **Smooth Transitions** — Hover effects with opacity and shadow changes  

## Feedback Types

### Pending
Shown during transaction processing:
```
⏳ Processing transaction...
```

### Success
Shown when transaction succeeds:
```
✅ Transaction successful!
```
Or custom message:
```
✅ 1000 AEOS claimed successfully!
```

### Error
Shown when transaction fails:
```
❌ User rejected the request
```

## Return Custom Messages

```jsx
const handleClaim = async () => {
  const hash = await contract.claim()
  
  // Optional: Return custom success message
  return { 
    message: `✅ Successfully claimed 1000 AEOS!` 
  }
  
  // If you don't return anything, default message is used
}

<ContractButton label="Claim Tokens" onClick={handleClaim} />
```

## Error Handling

Errors are automatically caught and displayed. You can throw custom errors:

```jsx
const handleDeposit = async () => {
  const amount = parseEther('100')
  
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  
  const tx = await contract.deposit(amount)
  return { message: '✅ Deposited 100 tokens!' }
}

<ContractButton label="Deposit" onClick={handleDeposit} />
```

## Example: Claim Tokens with Auto-Refetch

```jsx
import ContractButton from './ContractButton'
import { useAeosVesting } from '../hooks/useAeosVesting'
import { BigInt } from 'viem'

function ClaimButton({ investmentIndex, onRefresh }) {
  const { releaseStrategic } = useAeosVesting()

  const handleClaim = async () => {
    const hash = await releaseStrategic.writeAsync?.({
      args: [BigInt(investmentIndex)],
    })
    
    return { message: '✅ Tokens claimed successfully!' }
  }

  return (
    <ContractButton
      label="💰 Claim Tokens"
      onClick={handleClaim}
      variant="success"
      fullWidth
      onSuccess={onRefresh}  // ← Refetch data after success!
    />
  )
}
```

**Key Point:** The `onSuccess` callback is called automatically after the transaction succeeds. Use it to:
- Refetch investment details
- Refresh balances
- Update UI state
- Trigger other side effects

## Example: Multiple Buttons in a Form

```jsx
function VestingForm() {
  const { approveUSDT, buyStrategic } = useAeosVesting()

  const handleApprove = async () => {
    await approveUSDT.writeAsync?.({ args: [contractAddress, amount] })
    return { message: '✅ USDT approved!' }
  }

  const handlePurchase = async () => {
    await buyStrategic.writeAsync?.({ args: [amount] })
    return { message: '✅ Vesting purchased!' }
  }

  return (
    <div className="space-y-4">
      <ContractButton
        label="Approve USDT"
        onClick={handleApprove}
        fullWidth
      />
      <ContractButton
        label="Purchase Vesting"
        onClick={handlePurchase}
        variant="success"
        fullWidth
      />
    </div>
  )
}
```

## Styling with Tailwind

Add custom classes via `className` prop:

```jsx
<ContractButton
  label="Special Button"
  onClick={handler}
  className="shadow-lg hover:shadow-xl"
/>
```

## Light/Dark Mode Support

Buttons automatically adapt to light and dark themes using Tailwind's `dark:` prefix:

- **Background:** Semi-transparent color (20% opacity) blends with any background
- **Text Color:** Auto-adjusts for readability:
  - Light mode: Darker shade of the variant color
  - Dark mode: Lighter shade of the variant color
- **Borders:** Subtle borders (30% opacity) for definition

No additional configuration needed — works out of the box! 🌙☀️

## Tips

1. **Always return from async handlers** — Let ContractButton catch errors
2. **Keep labels short** — Especially on mobile
3. **Use variant colors semantifically** — Primary for main, success for approve, danger for delete
4. **Test error handling** — Verify error messages are clear
5. **Custom messages** — Return success object for contextual feedback

## Migration from Old Buttons

### Before
```jsx
<button
  onClick={handleClaim}
  disabled={loading || !canClaim}
  className="btn-primary"
>
  {loading ? '⏳ Processing...' : 'Claim'}
</button>

try {
  const result = await contract.claim()
  alert('Success!')
} catch (err) {
  alert(`Error: ${err.message}`)
}
```

### After
```jsx
<ContractButton
  label="Claim"
  onClick={async () => {
    await contract.claim()
    return { message: '✅ Claim successful!' }
  }}
  variant="success"
/>
```

Much simpler! No need to manage loading state or error alerts separately.
