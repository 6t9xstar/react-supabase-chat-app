import { Trash2 } from 'lucide-react'

interface ConfirmDeleteModalProps {
  open: boolean
  onClose: () => void
  onDeleteForMe: () => void
  onDeleteForEveryone?: () => void
  title?: string
  message?: string
}

/**
 * iOS-style action sheet for delete confirmations.
 * Slides up from the bottom with two destructive actions + cancel.
 */
export default function ConfirmDeleteModal({
  open,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
  title = 'Delete message',
  message = 'How do you want to delete this message?',
}: ConfirmDeleteModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-ios-fade"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-h-[90dvh] overflow-hidden rounded-t-ios-xl bg-ios-grouped-light shadow-ios-sheet dark:bg-ios-grouped-dark animate-ios-slide-up">
        <div className="ios-sheet-grabber" aria-hidden />

        <div className="px-4 pt-2 pb-2 text-center">
          <h2 className="text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark">
            {title}
          </h2>
          <p className="mt-1 px-4 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
            {message}
          </p>
        </div>

        <div className="ios-action-group">
          {onDeleteForEveryone && (
            <button onClick={onDeleteForEveryone} className="ios-action ios-action-destructive">
              <Trash2 className="h-[18px] w-[18px]" />
              <span>Delete for everyone</span>
            </button>
          )}
          <button onClick={onDeleteForMe} className="ios-action ios-action-destructive">
            <Trash2 className="h-[18px] w-[18px]" />
            <span>Delete for me</span>
          </button>
        </div>

        <div className="ios-action-group ios-action-cancel-group">
          <button onClick={onClose} className="ios-action ios-action-cancel">
            <span>Cancel</span>
          </button>
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
