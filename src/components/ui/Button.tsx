import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'tinted'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
}

const variantMap: Record<Variant, string> = {
  primary:
    'bg-ios-blue-light text-white active:bg-ios-blue-light/80 dark:bg-ios-blue-dark dark:active:bg-ios-blue-dark/80',
  secondary:
    'bg-ios-fill-light text-ios-label-light active:bg-ios-fill-light/70 dark:bg-ios-fill-dark dark:text-ios-label-dark dark:active:bg-ios-fill-dark/70',
  ghost:
    'bg-transparent text-ios-blue-light active:bg-ios-fill-light dark:text-ios-blue-dark dark:active:bg-ios-fill-dark',
  destructive:
    'bg-ios-red-light text-white active:bg-ios-red-light/80 dark:bg-ios-red-dark dark:active:bg-ios-red-dark/80',
  tinted:
    'bg-ios-blue-light/12 text-ios-blue-light active:bg-ios-blue-light/20 dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark',
}

const sizeMap: Record<Size, string> = {
  sm: 'h-7 px-3 text-[13px] rounded-ios-sm',
  md: 'h-9 px-4 text-[15px] rounded-ios',
  lg: 'h-11 px-5 text-[17px] rounded-ios-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 ${variantMap[variant]} ${sizeMap[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        children
      )}
    </button>
  )
}
