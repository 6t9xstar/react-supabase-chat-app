import { useEffect, useRef, useCallback } from 'react'
import type { Message } from '../../types/database'
import MessageItem from './MessageItem'
import { Loader2 } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
  loading: boolean
  hasMore: boolean
  currentUserId: string
  onLoadMore: () => void
  onReply: (message: Message) => void
}

export default function MessageList({ messages, loading, hasMore, currentUserId, onLoadMore, onReply }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (isFirstLoad.current && !loading) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
    } else if (messages.length > prevLengthRef.current) {
      const diff = messages.length - prevLengthRef.current
      if (diff === 1) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    prevLengthRef.current = messages.length
  }, [messages.length, loading])

  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return
    if (containerRef.current.scrollTop < 100) onLoadMore()
  }, [loading, hasMore, onLoadMore])

  if (loading && messages.length === 0) {
    return <div class="flex flex-1 items-center justify-center"><Loader2 class="h-6 w-6 animate-spin text-brand-500" /></div>
  }

  if (messages.length === 0) {
    return <div class="flex flex-1 items-center justify-center text-sm text-gray-400">No messages yet. Start the conversation!</div>
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} class="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      {loading && hasMore && (
        <div class="flex justify-center py-2"><Loader2 class="h-4 w-4 animate-spin text-gray-400" /></div>
      )}
      <div class="space-y-1">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} isOwn={msg.sender_id === currentUserId} onReply={onReply} />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
