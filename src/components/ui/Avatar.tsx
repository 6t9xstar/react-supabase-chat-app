import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  online?: boolean
  ring?: boolean
  className?: string
}

/**
 * iOS Messages-style avatar.
 * - Square-ish with subtle rounding
 * - Initials fallback with a deterministic soft pastel
 * - Optional online dot
 */
const sizeMap: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px] rounded-[6px]',
  sm: 'h-8 w-8 text-xs rounded-[8px]',
  md: 'h-10 w-10 text-sm rounded-[10px]',
  lg: 'h-14 w-14 text-base rounded-[14px]',
  xl: 'h-20 w-20 text-xl rounded-[18px]',
  '2xl': 'h-28 w-28 text-3xl rounded-[24px]',
}

const dotMap: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5 border',
  sm: 'h-2 w-2 border',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-3.5 w-3.5 border-2',
  '2xl': 'h-4 w-4 border-2',
}

const PALETTE = [
  '#FF9500', // orange
  '#FF3B30', // red
  '#AF52DE', // purple
  '#5856D6', // indigo
  '#007AFF', // blue
  '#34C759', // green
  '#5AC8FA', // teal
  '#FF2D55', // pink
]

function pickColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

export default function Avatar({ src, name, size = 'md', online, ring, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const showImg = src && !imgError

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('') || '?'

  const bg = pickColor(name)

  return (
    <div className={`relative inline-flex shrink-0 ${sizeMap[size]} ${className}`}>
      {showImg ? (
        <img
          src={src!}
          alt={name}
          className={`h-full w-full object-cover ${sizeMap[size].split(' ').slice(-1)[0]}`}
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold text-white ${sizeMap[size].split(' ').slice(-1)[0]}`}
          style={{ backgroundColor: bg }}
          aria-label={name}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute -bottom-0 -right-0 rounded-full border-ios-bg-light dark:border-ios-bg-dark ${
            online ? 'bg-ios-green-light dark:bg-ios-green-dark' : 'bg-ios-fill-light dark:bg-ios-fill-dark'
          } ${dotMap[size]}`}
        />
      )}
      {ring && (
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-ios-blue-light dark:ring-ios-blue-dark ring-offset-2 ring-offset-ios-bg-light dark:ring-offset-ios-bg-dark" />
      )}
    </div>
  )
}
