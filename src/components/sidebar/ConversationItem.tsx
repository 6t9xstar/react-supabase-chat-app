import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import type { ConversationWithMeta } from '../../types/database'
import { formatDistanceToNow } from '../../lib/formatDate'

interface ConversationItemProps {
  conversation: ConversationWithMeta
  isActive: boolean
  onSelect: (id: string) => void
}

export default function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const displayName = conversation.type === 'direct'
    ? (conversation.other_user?.full_name ?? 'Unknown')
    : (conversation.name ?? 'Unnamed Group')

  const lastMsg = conversation.last_message
  const preview = lastMsg?.deleted_at
    ? 'Message deleted'
    : (lastMsg?.content ?? 'No messages yet')

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 ${
        isActive ? 'bg-brand-50' : ''
      }`}
    >
      <Avatar
        name={displayName}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-gray-900">
            {displayName}
          </p>
          {lastMsg && (
            <span className="shrink-0 text-xs text-gray-400">
              {formatDistanceToNow(lastMsg.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="truncate text-xs text-gray-500">
            {preview}
          </p>
          <Badge count={conversation.unread_count ?? 0} />
        </div>
      </div>
    </button>
  )
}
