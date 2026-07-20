import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b px-6 py-4">
          <h2 class="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
