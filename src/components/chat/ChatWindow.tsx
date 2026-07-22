import { useState, useEffect, useCallback } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Message } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { markAsRead } from '../../lib/messages'
import { useMessages } from '../../hooks/useMessages'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { usePresence } from '../../hooks/usePresence'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageComposer from './MessageComposer'
import ForwardModal from '../modals/ForwardModal'
import ConfettiEffect from './ConfettiEffect'

interface ChatWindowProps {
  conversationId: string
  user: SupabaseUser
  isAdmin?: boolean
  onGroupSettings?: () => void
  onBack?: () => void
}

export default function ChatWindow({
  conversationId,
  user,
  isAdmin,
  onGroupSettings,
  onBack,
}: ChatWindowProps) {
  const {
    messages,
    loading,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    sendWithAttachments,
    forwardMessage,
  } = useMessages(conversationId, user.id)
  const { typingUserIds, setTyping } = useTypingIndicator(conversationId, user.id)
  const { onlineUserIds } = usePresence(conversationId, user.id)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null)
  const [typingNames, setTypingNames] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [isGroup, setIsGroup] = useState(false)

  useEffect(() => {
    if (!conversationId) return
    supabase
      .from('conversations')
      .select('type')
      .eq('id', conversationId)
      .single()
      .then(({ data }) => setIsGroup(data?.type === 'group'))
  }, [conversationId])

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId, user.id)
        .then(() => window.dispatchEvent(new CustomEvent('mark-read', { detail: conversationId })))
        .catch((e) => console.error('Failed to mark as read:', e))
    }
  }, [conversationId, user.id])

useEffect(() => {
    if (typingUserIds.length === 0) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', typingUserIds)
      .then(({ data }) => {
        if (cancelled || !data) return
        const map = new Map(data.map((p: { id: string; full_name: string }) => [p.id, p.full_name]))
        setTypingNames(
          typingUserIds.map((id) => map.get(id) ?? 'Someone').filter(Boolean)
        )
      })
    return () => { cancelled = true }
  }, [typingUserIds])

  const handleRetry = useCallback(
    (msg: Message) => {
      const content = msg.content ?? ''
      if (content) sendMessage(content, msg.reply_to_id ?? null, msg.forwarded_from_id ?? null)
    },
    [sendMessage]
  )

  const handleSendMessage = useCallback(
    (content: string, replyToId?: string | null) => {
      sendMessage(content, replyToId ?? null)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
    },
    [sendMessage]
  )

  const handleSendWithAttachments = useCallback(
    (content: string, attachments: any[], replyToId?: string | null) => {
      sendWithAttachments(content, attachments, replyToId ?? null)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
    },
    [sendWithAttachments]
  )

  return (
    <>
      <ConfettiEffect active={showConfetti} />
      <div className="flex flex-1 flex-col overflow-hidden bg-ios-bg-light dark:bg-ios-grouped-dark">
        <ChatHeader
          conversationId={conversationId}
          currentUserId={user.id}
          onlineUserIds={onlineUserIds}
          isAdmin={isAdmin}
          onGroupSettings={onGroupSettings}
          onBack={onBack}
          typingNames={typingNames}
        />

        <MessageList
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          currentUserId={user.id}
          conversationId={conversationId}
          isGroup={isGroup}
          onLoadMore={loadMore}
          onReply={setReplyTo}
          onForward={setForwardMsg}
          onRetry={handleRetry}
        />

        <MessageComposer
          conversationId={conversationId}
          senderId={user.id}
          sending={sending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSendMessage={(content, replyToId) => {
            handleSendMessage(content, replyToId)
            setReplyTo(null)
          }}
          onSendWithAttachments={(content, attachments, replyToId) => {
            handleSendWithAttachments(content, attachments, replyToId)
            setReplyTo(null)
          }}
          onTyping={setTyping}
        />

        {forwardMsg && (
          <ForwardModal
            open={!!forwardMsg}
            onClose={() => setForwardMsg(null)}
            userId={user.id}
            onForward={(targetConvId) => {
              const content = forwardMsg.content ?? ''
              if (content) forwardMessage(targetConvId, content, forwardMsg.id)
              setForwardMsg(null)
            }}
          />
        )}
      </div>
    </>
  )
}
