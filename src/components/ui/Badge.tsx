import type { ReactNode } from 'react'

interface BadgeProps {
  count: number
  className?: string
}

export default function Badge({ count, className = '' }: BadgeProps) {
  if (count <= 0) return null
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-xs font-bold text-white min-w-[20px] ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
