import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Force centered (e.g. desktop admin) instead of bottom sheet */
  variant?: 'sheet' | 'centered'
  /** Hide the close button */
  hideClose?: boolean
}

let modalCounter = 0

/**
 * iOS-style modal:
 * - Mobile: bottom-anchored sheet with grabber, slides up
 * - Desktop: centered card with rounded corners + sheet animation
 * - Always: backdrop fade, focus trap, ESC closes
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'sheet',
  hideClose,
}: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [titleId] = useState(() => `modal-title-${modalCounter++}`)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const root = e.currentTarget as HTMLElement
      const focusable = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
  }

  if (!open) return null

  const isCentered = variant === 'centered'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-ios-fade md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={sheetRef}
        className={`relative w-full overflow-hidden bg-ios-bg-light shadow-ios-lg dark:bg-ios-grouped-dark md:bg-ios-bg-light md:dark:bg-ios-grouped-dark ${
          isCentered
            ? 'mx-4 max-w-lg rounded-ios-xl animate-ios-pop'
            : 'max-h-[90dvh] rounded-t-ios-xl animate-ios-slide-up md:max-h-[80vh] md:max-w-lg md:rounded-ios-xl'
        }`}
        role="document"
      >
        {!isCentered && <div className="ios-sheet-grabber" aria-hidden />}

        {title && (
          <div className="relative flex items-center justify-center border-b border-ios-separator-light px-4 py-3 dark:border-ios-separator-dark md:px-6">
            <h2
              id={titleId}
              className="text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark"
            >
              {title}
            </h2>
            {!hideClose && (
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ios-fill-light text-ios-secondary_label-light active:bg-ios-fill-light/70 dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark md:right-4 md:top-4"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
