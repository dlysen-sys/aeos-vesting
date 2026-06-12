# Lucide Icons Guide

All UI icons should use **Lucide** for consistency and accessibility.

## Installation

Lucide is already installed in `package.json`:
```bash
npm install lucide-react
```

## Common Icons Used

### Navigation
- `Home` — Dashboard/Home
- `Settings` — Admin/Configuration
- `Menu` — Mobile menu
- `X` — Close/Exit
- `LogOut` — Disconnect wallet
- `Zap` — Network status

### Actions
- `Copy` — Copy to clipboard
- `Download` — Download/Export
- `Upload` — Upload/Import
- `Eye` — View/Show
- `EyeOff` — Hide
- `Check` — Success/Checkmark
- `AlertCircle` — Warning
- `AlertTriangle` — Error

### States
- `Loader` — Loading spinner
- `CheckCircle` — Success state
- `XCircle` — Error state
- `Clock` — Pending/Timer
- `Lock` — Locked
- `Unlock` — Unlocked

### Finance
- `DollarSign` — Price/Amount
- `Wallet` — Wallet
- `Send` — Send/Transfer
- `TrendingUp` — Growth/Increase
- `TrendingDown` — Decrease

## Usage Examples

### Import
```jsx
import { Home, Settings, LogOut, Zap } from 'lucide-react'
```

### Basic Usage
```jsx
<Home size={24} color="#FFB800" />
<Settings size={20} className="text-yellow-500" />
<LogOut size={18} className="inline mr-2" />
```

### With Styling
```jsx
// Inline style
<Home size={24} style={{ color: '#FFB800' }} />

// Tailwind classes
<Settings size={20} className="text-yellow-500 hover:text-yellow-600" />

// Dynamic color
<Zap size={16} color={isActive ? '#10B981' : '#A0AEC0'} />
```

### In Buttons
```jsx
import { LogOut } from 'lucide-react'

<button className="flex items-center gap-2">
  <LogOut size={18} />
  <span>Disconnect</span>
</button>
```

### Props
- `size` — Icon size (default: 24)
- `color` — Icon color (hex, rgb, or color name)
- `stroke` — Stroke width (default: 2)
- `strokeWidth` — Alternative to stroke
- `className` — Tailwind classes
- `style` — Inline styles

## Size Guidelines

| Context | Size | Example |
|---------|------|---------|
| Large buttons | 24px | Navbar buttons |
| Regular buttons | 20px | Form buttons |
| Small buttons | 16-18px | Inline icons |
| Inline text | 16px | With text |
| Menu items | 20px | Navigation |

## Color Guidelines

- **Primary (Yellow):** `#FFB800` — Main actions
- **Success (Green):** `#10B981` — Success states
- **Danger (Red):** `#EF4444` — Errors/Warnings
- **Muted (Gray):** `#A0AEC0` — Disabled/Secondary
- **Dark:** `#0F1419` — Backgrounds

## Replacing Emoji

### Before (❌ Emoji)
```jsx
<span>⚙️ Admin</span>
<span>🟡 Claim</span>
```

### After (✅ Lucide)
```jsx
<span className="flex items-center gap-2">
  <Settings size={18} />
  <span>Admin</span>
</span>

<span className="flex items-center gap-2">
  <Zap size={18} color="#FFB800" />
  <span>Claim</span>
</span>
```

## Available Icons

Lucide has **400+ icons**. Browse at: https://lucide.dev

Common patterns:
- `*Circle` variants for outlined badges
- `*Square` variants for filled states
- `Arrow*` for directional indicators
- `Chevron*` for collapsible menus
- `Info`, `AlertCircle`, `AlertTriangle` for messaging

## Best Practices

✅ **Do:**
- Use consistent icon sizes across similar UI elements
- Pair icons with text labels for clarity
- Use semantic icons (Settings for admin, Home for dashboard)
- Maintain color semantics (green = success, red = danger)

❌ **Don't:**
- Mix emoji and lucide icons in the same UI
- Use icons without labels in mobile views
- Use overly large icons for inline content
- Change icon meanings (red checkmark, green X)

## Examples in Codebase

### MobileNav.jsx
```jsx
import { Menu, X, Home, Settings, LogOut } from 'lucide-react'

<Menu size={24} />
<Settings size={18} />
<LogOut size={20} />
```

### Navbar.jsx
```jsx
import { LogOut, Zap } from 'lucide-react'

<LogOut size={16} />
<Zap size={16} className="inline mr-1" />
```

### ContractButton.jsx
Can use icons in button labels:
```jsx
<button>
  <Zap size={18} />
  <span>Execute</span>
</button>
```

## Color Modes

Icons automatically adapt using Tailwind's `dark:` prefix:

```jsx
<Home 
  size={24} 
  className="text-gray-700 dark:text-gray-300"
/>
```

Or with lucide props:
```jsx
<Home 
  size={24} 
  color={isDark ? '#D1D5DB' : '#374151'}
/>
```
