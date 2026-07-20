import { X, Reply } from 'lucide-react'
import type { Message } from '../../types/database'

interface ReplyPreviewProps {
  message: Message
  onCancel: () => void
}

export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  return (
    <div class="flex items-center gap-3 border-l-4 border-brand-500 bg-brand-50 px-4 py-2 text-sm">
      <Reply class="h-4 w-4 shrink-0 text-brand-500" />
      <div class="flex-1 min-w-0">
        <p class="truncate text-xs font-medium text-brand-700">Replying to message</p>
        <p class="truncate text-xs text-gray-500">
          {message.deleted_at ? 'Message deleted' : (message.content || 'File message')}
        </p>
      </div>
      <button
        onClick={onCancel}
        class="shrink-0 rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  )
}
