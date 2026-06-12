import { useState, useEffect } from 'react'
import { Loader, Check, AlertCircle, Clock } from 'lucide-react'

export default function ContractButton({
  label,
  onClick,
  disabled = false,
  variant = 'primary', // primary, success, danger, secondary
  size = 'md', // sm, md, lg
  fullWidth = false,
  className = '',
  onSuccess = null, // Optional callback after successful transaction
}) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'error' | 'success' | 'pending', message: string }
  const [feedbackKey, setFeedbackKey] = useState(0) // Force re-render for animations

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedbackKey, feedback])

  const getFeedbackStyle = () => {
    const colorMap = {
      error: {
        bg: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
        text: 'var(--destructive)',
        border: 'color-mix(in srgb, var(--destructive) 30%, transparent)',
      },
      success: {
        bg: 'color-mix(in srgb, #10b981 10%, transparent)',
        text: '#10b981',
        border: 'color-mix(in srgb, #10b981 30%, transparent)',
      },
      pending: {
        bg: 'color-mix(in srgb, #f97316 10%, transparent)',
        text: '#f97316',
        border: 'color-mix(in srgb, #f97316 30%, transparent)',
      },
    }

    const colors = colorMap[feedback.type]
    return {
      backgroundColor: colors.bg,
      color: colors.text,
      borderColor: colors.border,
    }
  }

  const getButtonStyle = () => {
    const colorMap = {
      primary: {
        bg: 'color-mix(in srgb, var(--primary) 10%, transparent)',
        text: 'var(--primary)',
        border: 'color-mix(in srgb, var(--primary) 30%, transparent)',
      },
      success: {
        bg: 'color-mix(in srgb, #10b981 10%, transparent)',
        text: '#10b981',
        border: 'color-mix(in srgb, #10b981 30%, transparent)',
      },
      danger: {
        bg: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
        text: 'var(--destructive)',
        border: 'color-mix(in srgb, var(--destructive) 30%, transparent)',
      },
      secondary: {
        bg: 'color-mix(in srgb, var(--muted) 50%, transparent)',
        text: 'var(--foreground)',
        border: 'var(--border)',
      },
    }

    const colors = colorMap[variant]
    return {
      backgroundColor: colors.bg,
      color: colors.text,
      borderColor: colors.border,
      borderWidth: '1px',
    }
  }

  const handleClick = async () => {
    try {
      setLoading(true)
      setFeedback(null)

      // Show pending state
      setFeedback({ type: 'pending', message: 'Processing transaction...' })
      setFeedbackKey((prev) => prev + 1)

      // Call the async onClick handler
      const result = await onClick()

      // Success message from handler or default
      const successMessage = result?.message || '✅ Transaction successful!'
      setFeedback({ type: 'success', message: successMessage })
      setFeedbackKey((prev) => prev + 1)

      // Call onSuccess callback if provided (for refetching, etc.)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error message from handler or from error object
      const errorMessage = err?.message || err?.toString() || 'An error occurred'
      const cleanMessage = errorMessage
        .replace('Error: ', '')
        .replace(/RPC submit: /, '')
        .split('\n')[0] // Get first line only

      setFeedback({
        type: 'error',
        message: cleanMessage.length > 100 ? cleanMessage.slice(0, 100) + '...' : cleanMessage,
      })
      setFeedbackKey((prev) => prev + 1)
      console.error('ContractButton error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Button variant styles - using CSS theme variables for light/dark mode
  const variantStyles = {
    primary: 'font-semibold border transition-all',
    success: 'font-semibold border transition-all',
    danger: 'font-semibold border transition-all',
    secondary: 'font-semibold border transition-all',
  }

  // Button size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const feedbackIcons = {
    error: <AlertCircle size={18} />,
    success: <Check size={18} />,
    pending: <Clock size={18} />,
  }

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : 'w-fit'}`}>
      {/* Button */}
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`
          ${sizeStyles[size]}
          rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        style={getButtonStyle()}
      >
        {loading ? (
          <>
            <Loader size={20} className="animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          label
        )}
      </button>

      {/* Feedback Message */}
      {feedback && (
        <div
          key={feedbackKey}
          className="mt-3 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300 border"
          style={getFeedbackStyle()}
        >
          <span className="text-lg flex-shrink-0 mt-0.5">{feedbackIcons[feedback.type]}</span>
          <span className="flex-1 break-words">{feedback.message}</span>
        </div>
      )}
    </div>
  )
}
