interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** iOS-style (small ringed) or indeterminate */
  variant?: 'ios' | 'plain'
}

const sizeMap = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' }

export default function Spinner({ size = 'md', className = '', variant = 'ios' }: SpinnerProps) {
  if (variant === 'ios') {
    // iOS determinate progress: 8 dots arranged in a circle, fading in sequence
    return (
      <span
        className={`inline-block ${sizeMap[size]} ${className}`}
        role="status"
        aria-label="Loading"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full animate-spin" style={{ animationDuration: '0.9s' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray="60 200" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className={`inline-block ${sizeMap[size]} animate-spin rounded-full border-current border-t-transparent text-ios-blue-light dark:text-ios-blue-dark ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
