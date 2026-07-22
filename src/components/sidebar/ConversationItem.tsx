import { useState, useRef } from 'react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { formatDistanceToNow } from '../../lib/formatDate'
import { Pin, PinOff, Check, Archive } from 'lucide-react'
import { togglePinnedConversation, isPinned } from '../../lib/pinned'
import { toggleArchivedConversation, isArchived } from '../../lib/archived'
import type { ConversationWithMeta } from '../../types/database'

interface ConversationItemProps {
  conversation: ConversationWithMeta
  isActive: boolean
  onSelect: (id: string) => void
  currentUserId?: string
}

export default function ConversationItem({ conversation, isActive, onSelect, currentUserId }: ConversationItemProps) {
  const [pinned, setPinned] = useState(isPinned(conversation.id))
  const [archived, setArchived] = useState(isArchived(conversation.id))
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeStartX = useRef(0)
  const swipeStartOffset = useRef(0)

  const isDirect = conversation.type === 'direct'
  const displayName = isDirect
    ? (conversation.other_user?.full_name ?? 'User')
    : (conversation.name ?? 'Unnamed Group')

  const lastMsg = conversation.last_message
  const isOwnLastMsg = lastMsg?.sender_id === currentUserId
  const isUnread = (conversation.unread_count ?? 0) > 0

  const previewText = lastMsg?.deleted_at
    ? 'Message deleted'
    : lastMsg?.content
      ? lastMsg.content
      : lastMsg
        ? '📎 File message'
        : 'No messages yet'

  const togglePin = () => {
    togglePinnedConversation(conversation.id)
    setPinned(!pinned)
  }
  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    togglePin()
  }

  const toggleArchive = () => {
    toggleArchivedConversation(conversation.id)
    setArchived(!archived)
  }
  const handleArchiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleArchive()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartOffset.current = swipeOffset
    setIsSwiping(true)
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const diff = e.touches[0].clientX - swipeStartX.current
    setSwipeOffset(Math.max(-80, Math.min(80, swipeStartOffset.current + diff)))
  }
  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (swipeOffset < -40) {
      if (!pinned) togglePin()
      setSwipeOffset(0)
    } else if (swipeOffset > 40) {
      if (!archived) toggleArchive()
      setSwipeOffset(0)
    } else {
      setSwipeOffset(0)
    }
  }

  return (
    <div className="relative overflow-hidden">
      {swipeOffset !== 0 && (
        <div
          className="absolute inset-y-0 flex items-center px-4 text-xs font-medium text-white"
          style={{
            left: swipeOffset > 0 ? '0' : 'auto',
            right: swipeOffset < 0 ? '0' : 'auto',
            background: swipeOffset < 0
              ? 'linear-gradient(to left, #d97706, #f59e0b)'
              : 'linear-gradient(to right, #2563eb, #3b82f6)',
          }}
        >
          {swipeOffset < 0 ? 'Archive' : 'Pin'}
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <button
          role="listitem"
          onClick={() => {
            onSelect(conversation.id)
            setSwipeOffset(0)
          }}
          className={`group flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#2a2a2a] ${
            isActive ? 'bg-brand-50 dark:bg-[#2a2a2a]' : ''
          }`}
        >
          <Avatar
            name={displayName}
            size="md"
            src={conversation.other_user?.avatar_url}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 truncate text-sm font-medium text-gray-900 dark:text-[#ececec]">
                {pinned && <Pin className="h-3 w-3 shrink-0 text-gray-400" />}
                {displayName}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                {lastMsg && (
                  <span className="text-xs text-gray-400 dark:text-[#888]">
                    {formatDistanceToNow(lastMsg.created_at)}
                  </span>
                )}
                <button
                  onClick={handleArchiveToggle}
                  className={`rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    archived ? 'text-amber-500 opacity-100' : 'text-gray-400 hover:text-amber-500'
                  }`}
                  title={archived ? 'Unarchive conversation' : 'Archive conversation'}
                  aria-label={archived ? 'Unarchive conversation' : 'Archive conversation'}
                >
                  <Archive className="h-3 w-3" />
                </button>
                <button
                  onClick={handlePinToggle}
                  className={`rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    pinned ? 'text-brand-500 opacity-100' : 'text-gray-400 hover:text-brand-500'
                  }`}
                  title={pinned ? 'Unpin conversation' : 'Pin conversation'}
                  aria-label={pinned ? 'Unpin conversation' : 'Pin conversation'}
                >
                  <Pin className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-gray-500 dark:text-[#999]">
                {isOwnLastMsg && (
                  <span className="inline-flex mr-0.5 align-text-bottom">
                    {lastMsg?.status === 'sending' ? (
                      <span className="text-gray-400 text-[10px]">⏳</span>
                    ) : lastMsg?.status === 'failed' ? (
                      <span className="text-red-400 text-[10px]">⚠</span>
                    ) : (
                      <Check className="h-3 w-3 text-gray-400 dark:text-[#888]" />
                    )}
                  </span>
                )}
                {previewText}
              </p>
              <Badge count={conversation.unread_count ?? 0} />
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
