interface BadgeProps {
  count: number
  className?: string
  /** Render as plain number (used in lists); default pill is for sidebar unread */
  variant?: 'pill' | 'plain'
}

/**
 * iOS-style unread badge.
 * Light: white bubble on green (iOS Mail style); we use blue to match accent.
 */
export default function Badge({ count, className = '', variant = 'pill' }: BadgeProps) {
  if (count <= 0) return null
  if (variant === 'plain') {
    return (
      <span className={`text-ios-blue-light dark:text-ios-blue-dark text-[15px] font-semibold ${className}`}>
        {count}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex min-w-[20px] items-center justify-center rounded-full bg-ios-red-light px-1.5 text-[12px] font-semibold leading-none text-white dark:bg-ios-red-dark ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
