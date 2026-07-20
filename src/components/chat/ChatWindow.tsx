import { useState, useEffect } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Message } from '../../types/database'
import { markAsRead } from '../../lib/messages'
import { useMessages } from '../../hooks/useMessages'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { usePresence } from '../../hooks/usePresence'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageComposer from './MessageComposer'

interface ChatWindowProps {
  conversationId: string
  user: SupabaseUser
  isAdmin?: boolean
  onGroupSettings?: () => void
  onBack?: () => void
}

export default function ChatWindow({ conversationId, user, isAdmin, onGroupSettings, onBack }: ChatWindowProps) {
  const { messages, loading, hasMore, sending, loadMore, sendMessage, sendWithAttachments } = useMessages(conversationId, user.id)
  const { typingUserIds, setTyping } = useTypingIndicator(conversationId, user.id)
  const { onlineUserIds } = usePresence(conversationId, user.id)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  useEffect(() => {
    if (conversationId) markAsRead(conversationId, user.id).catch(() => {})
  }, [conversationId, user.id])

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        conversationId={conversationId}
        currentUserId={user.id}
        onlineUserIds={onlineUserIds}
        isAdmin={isAdmin}
        onGroupSettings={onGroupSettings}
        onBack={onBack}
      />

      {typingUserIds.length > 0 && (
        <div className="bg-gray-50 px-6 py-1 text-xs text-gray-400 italic">Someone is typing...</div>
      )}

      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        currentUserId={user.id}
        onLoadMore={loadMore}
        onReply={setReplyTo}
      />

      <MessageComposer
        conversationId={conversationId}
        senderId={user.id}
        sending={sending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSendMessage={(content, replyToId) => { sendMessage(content, replyToId ?? null); setReplyTo(null) }}
        onSendWithAttachments={(content, attachments, replyToId) => { sendWithAttachments(content, attachments, replyToId ?? null); setReplyTo(null) }}
        onTyping={setTyping}
      />
    </div>
  )
}
