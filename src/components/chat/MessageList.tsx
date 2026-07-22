import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import type { Message, PinnedMessage } from '../../types/database'
import { getPinnedMessages } from '../../lib/messages'
import MessageItem from './MessageItem'
import { Loader2, Pin, ChevronDown, MessageCircle } from 'lucide-react'
import { formatDateSeparator, formatTimeShort } from '../../lib/formatDate'
import { MessageSkeleton } from '../ui/Skeleton'

interface MessageListProps {
  messages: Message[]
  loading: boolean
  hasMore: boolean
  currentUserId: string
  conversationId: string
  isGroup: boolean
  onLoadMore: () => void
  onReply: (message: Message) => void
  onForward: (message: Message) => void
  onRetry?: (message: Message) => void
  onJumpToMessage?: (id: string) => void
}

function isSameDay(a: string, b: string): boolean {
  return a?.slice(0, 10) === b?.slice(0, 10)
}

function isGrouped(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return false
  if (prev.sender_id !== curr.sender_id) return false
  if (curr.deleted_at) return false
  const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()
  return diff < 300000 // 5 minutes
}

/**
 * iOS Messages-style message list.
 *  - Date separators as centered text
 *  - Pinned bar at the top (with frosted background)
 *  - "New messages ↓" floating pill
 *  - Scroll-to-bottom on initial load
 *  - "↑↑" jump button to scroll up to a reply target
 */
export default function MessageList({
  messages,
  loading,
  hasMore,
  currentUserId,
  conversationId,
  isGroup,
  onLoadMore,
  onReply,
  onForward,
  onRetry,
  onJumpToMessage,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)
  const isFirstLoad = useRef(true)
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([])
  const [showNewMsg, setShowNewMsg] = useState(false)
  const isNearBottomRef = useRef(true)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const threshold = 150
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    isNearBottomRef.current = near
    if (near) setShowNewMsg(false)
  }, [])

  // Initial scroll to bottom
  useEffect(() => {
    if (isFirstLoad.current && !loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
    } else if (messages.length > prevLengthRef.current) {
      const diff = messages.length - prevLengthRef.current
      if (diff === 1 && isNearBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else if (diff > 0 && !isNearBottomRef.current) {
        setShowNewMsg(true)
      }
    }
    prevLengthRef.current = messages.length
  }, [messages.length, loading])

  // Load pinned messages
  useEffect(() => {
    if (!conversationId) return
    getPinnedMessages(conversationId).then(setPinnedMessages)
  }, [conversationId])

  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return
    if (containerRef.current.scrollTop < 100) onLoadMore()
    checkNearBottom()
  }, [loading, hasMore, onLoadMore, checkNearBottom])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNewMsg(false)
  }

  // When user clicks a reply preview, scroll to and flash the target message
  const handleJump = useCallback(
    (id: string) => {
      const el = messageRefs.current.get(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightId(id)
        setTimeout(() => setHighlightId(null), 1200)
      }
    },
    []
  )

  // Pinned bar: jump to it
  const handlePinnedClick = useCallback(
    (id: string) => {
      handleJump(id)
    },
    [handleJump]
  )

  const orderedMessages = useMemo(() => messages, [messages])

  if (loading && messages.length === 0) return (
    <div className="flex flex-1 flex-col bg-ios-grouped-light dark:bg-ios-grouped-dark">
      <MessageSkeleton />
    </div>
  )

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-ios-grouped-light dark:bg-ios-grouped-dark">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ios-fill-light dark:bg-ios-fill-dark">
            <MessageCircle
              className="h-7 w-7 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
              strokeWidth={1.8}
            />
          </div>
          <p className="text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark">
            No Messages Yet
          </p>
          <p className="mt-1 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col bg-ios-grouped-light dark:bg-ios-grouped-dark">
      {/* Pinned bar */}
      {pinnedMessages.length > 0 && (
        <div className="ios-blur sticky top-0 z-10 mx-3 mt-2 flex items-center gap-2 overflow-hidden rounded-ios-lg border border-ios-separator-light bg-ios-bg-light/85 px-3 py-2 shadow-ios-sm dark:border-ios-separator-dark dark:bg-ios-secondary-dark/85">
          <Pin className="h-3.5 w-3.5 shrink-0 text-ios-blue-light dark:text-ios-blue-dark" strokeWidth={2.5} />
          <p className="shrink-0 text-[12px] font-semibold text-ios-blue-light dark:text-ios-blue-dark">
            Pinned
          </p>
          <div className="h-3 w-px shrink-0 bg-ios-separator-light dark:bg-ios-separator-dark" />
          <p className="line-clamp-1 flex-1 text-[13px] text-ios-label-light dark:text-ios-label-dark">
            {pinnedMessages[0]?.message?.content ??
              (pinnedMessages[0]?.message?.attachments?.length ? '📎 Attachment' : 'Message')}
          </p>
          {pinnedMessages[0] && (
            <button
              onClick={() => handlePinnedClick(pinnedMessages[0].message_id)}
              className="ios-press shrink-0 text-[12px] font-medium text-ios-blue-light active:opacity-60 dark:text-ios-blue-dark"
            >
              View
            </button>
          )}
          {pinnedMessages.length > 1 && (
            <span className="shrink-0 text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              +{pinnedMessages.length - 1}
            </span>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="ios-chat-area flex-1 overflow-y-auto py-2 scrollbar-thin"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {loading && hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-ios-secondary_label-light dark:text-ios-secondary_label-dark" />
          </div>
        )}

        <div className="space-y-0">
          {orderedMessages.map((msg, i) => {
            const prev = i > 0 ? orderedMessages[i - 1] : undefined
            const next = i < orderedMessages.length - 1 ? orderedMessages[i + 1] : undefined
            const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at)
            const groupedPrev = isGrouped(prev, msg)
            const groupedNext = !!next && isGrouped(msg, next)
            const isHighlighted = highlightId === msg.id

            return (
              <div
                key={msg.id}
                ref={(el) => {
                  if (el) messageRefs.current.set(msg.id, el)
                  else messageRefs.current.delete(msg.id)
                }}
                className={isHighlighted ? 'animate-ios-fade' : ''}
              >
                {showDateSep && (
                  <div className="my-3 flex items-center justify-center px-3">
                    <span
                      className="rounded-full bg-ios-fill-light px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark"
                      style={{ letterSpacing: '0.06em' }}
                    >
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                {showDateSep && (
                  <div className="-mt-1 mb-1 flex justify-center">
                    <span className="rounded-full bg-ios-fill-light/80 px-2 py-0.5 text-[10px] text-ios-secondary_label-light dark:bg-ios-fill-dark/80 dark:text-ios-secondary_label-dark">
                      {formatTimeShort(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageItem
                  message={msg}
                  isOwn={msg.sender_id === currentUserId}
                  isGroup={isGroup}
                  showSender={isGroup && !groupedPrev}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onForward={onForward}
                  onRetry={onRetry}
                  groupedPrev={groupedPrev}
                  groupedNext={groupedNext}
                  onJumpToMessage={onJumpToMessage ? handleJump : undefined}
                />
              </div>
            )
          })}
        </div>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Scroll to new messages pill */}
      {showNewMsg && (
        <button
          onClick={scrollToBottom}
          className="ios-press absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ios-blue-light px-3.5 py-1.5 text-[13px] font-medium text-white shadow-ios active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
          aria-label="Scroll to new messages"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
          New messages
        </button>
      )}
    </div>
  )
}
