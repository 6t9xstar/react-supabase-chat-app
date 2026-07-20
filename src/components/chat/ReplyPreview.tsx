import { X, Reply } from 'lucide-react'
import type { Message } from '../../types/database'

interface ReplyPreviewProps {
  message: Message
  onCancel: () => void
}

export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  return (
    <div className="flex items-center gap-3 border-l-4 border-brand-500 bg-brand-50 px-4 py-2 text-sm">
      <Reply className="h-4 w-4 shrink-0 text-brand-500" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-brand-700">Replying to message</p>
        <p className="truncate text-xs text-gray-500">
          {message.deleted_at ? 'Message deleted' : (message.content || 'File message')}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
