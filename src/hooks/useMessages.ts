import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getMessages, sendMessage as sendMsgApi } from '../lib/messages'
import {
  getConversationTimer,
  getExpiresAt,
  isExpired,
} from '../lib/disappearing'
import type { Message, AttachmentInput } from '../types/database'

/* -------------------------------------------------------------------------- */
/*  useMessageList — paginated list with disappearing-message GC              */
/* -------------------------------------------------------------------------- */

function useMessageList(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const messagesRef = useRef<Message[]>([])
  const cancelledRef = useRef(false)
  const loadGenRef = useRef(0)

  // GC expired messages every 10s
  useEffect(() => {
    const t = setInterval(() => {
      setMessages((prev) => prev.filter((m) => !isExpired(m.expires_at)))
    }, 10000)
    return () => clearInterval(t)
  }, [])

  const loadInitial = useCallback(async () => {
    if (!conversationId) return
    cancelledRef.current = false
    setLoading(true)
    try {
      const { messages: msgs, hasMore: more } = await getMessages(conversationId)
      if (cancelledRef.current) return
      setMessages(msgs)
      setHasMore(more)
    } catch (err) {
      if (!cancelledRef.current) console.error('Failed to load messages:', err)
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [conversationId])

  const loadMore = useCallback(async () => {
    const msgs = messagesRef.current
    if (!conversationId || !msgs.length || !hasMore) return
    cancelledRef.current = false
    const oldest = msgs[0]
    const gen = ++loadGenRef.current
    try {
      const { messages: older, hasMore: more } = await getMessages(conversationId, {
        created_at: oldest.created_at,
        id: oldest.id,
      })
      if (cancelledRef.current || gen !== loadGenRef.current) return
      setMessages((prev) => [...older, ...prev])
      setHasMore(more)
    } catch (err) {
      if (!cancelledRef.current) console.error('Failed to load older messages:', err)
    }
  }, [conversationId, hasMore])

  // Reset + load on conversation change - use functional updates to avoid effect setState warning
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMessages([])
      setHasMore(true)
      cancelledRef.current = true
      try {
        if (conversationId) {
          await loadInitial()
        }
      } finally {
        cancelledRef.current = cancelled
      }
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId, loadInitial])

  // Keep ref in sync for loadMore closures
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  return { messages, setMessages, loading, hasMore, loadMore }
}

/* -------------------------------------------------------------------------- */
/*  useMessageChannel — realtime INSERT/UPDATE for messages + read receipts  */
/* -------------------------------------------------------------------------- */

function useMessageChannel(
  conversationId: string | null,
  currentUserId: string | undefined,
  onInsert: (msg: Message) => void,
  onUpdate: (msg: Message) => void,
  onReadReceipt: (receipt: { message_id: string; user_id: string }) => void
) {
  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id === currentUserId) return
          onInsert(msg)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onUpdate(payload.new as Message)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'read_receipts' },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string }
          if (r.user_id === currentUserId) return
          onReadReceipt(r)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, onInsert, onUpdate, onReadReceipt])
}

/* -------------------------------------------------------------------------- */
/*  Public hook: useMessages                                                  */
/*  Orchestrates list + channel + send with optimistic UI.                   */
/* -------------------------------------------------------------------------- */

export function useMessages(
  conversationId: string | null,
  currentUserId: string | undefined
) {
  const { messages, setMessages, loading, hasMore, loadMore } = useMessageList(conversationId)
  const [sending, setSending] = useState(false)
  const lastSendRef = useRef(0)

  const buildOptimistic = useCallback(
    (content: string, replyToId: string | null, forwardedFromId: string | null): Message => {
      const timer = conversationId ? getConversationTimer(conversationId) : 'off'
      return {
        id: crypto.randomUUID(),
        conversation_id: conversationId!,
        sender_id: currentUserId!,
        content: content || null,
        reply_to_id: replyToId,
        forwarded_from_id: forwardedFromId,
        is_edited: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: getExpiresAt(timer),
        status: 'sending',
      }
    },
    [conversationId, currentUserId]
  )

  const sendMessage = useCallback(
    async (
      content: string,
      replyToId: string | null = null,
      forwardedFromId: string | null = null
    ) => {
      if (!conversationId || !currentUserId || !content.trim()) return
      const now = Date.now()
      if (now - lastSendRef.current < 200) return
      lastSendRef.current = now

      const optimistic = buildOptimistic(content, replyToId, forwardedFromId)
      setMessages((prev) => [...prev, optimistic])
      setSending(true)
      try {
        const saved = await sendMsgApi(
          conversationId,
          currentUserId,
          content,
          replyToId,
          forwardedFromId
        )
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...saved, status: 'sent' } : m))
        )
      } catch (e) {
        console.error('Failed to send message:', e)
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'failed' } : m))
        )
      } finally {
        setSending(false)
      }
    },
    [conversationId, currentUserId, buildOptimistic, setMessages]
  )

  const sendWithAttachments = useCallback(
    async (
      content: string,
      attachments: AttachmentInput[],
      replyToId: string | null = null,
      forwardedFromId: string | null = null
    ) => {
      if (!conversationId || !currentUserId) return
      const now = Date.now()
      if (now - lastSendRef.current < 200) return
      lastSendRef.current = now

      const optimistic = buildOptimistic(content, replyToId, forwardedFromId)
      setMessages((prev) => [...prev, optimistic])
      setSending(true)
      try {
        const msgContent = content || null
        const { data: message, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: msgContent,
            reply_to_id: replyToId,
            forwarded_from_id: forwardedFromId,
          })
          .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
          .single()
        if (error) throw error
        if (attachments.length > 0) {
          await supabase.from('attachments').insert(
            attachments.map((att) => ({
              ...att,
              message_id: message.id,
              conversation_id: conversationId,
              sender_id: currentUserId,
            }))
          )
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...(message as unknown as Message), status: 'sent' } : m
          )
        )
      } catch (e) {
        console.error('Failed to send message with attachments:', e)
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'failed' } : m))
        )
      } finally {
        setSending(false)
      }
    },
    [conversationId, currentUserId, buildOptimistic, setMessages]
  )

  const forwardMessage = useCallback(
    async (targetConversationId: string, content: string, forwardedFromId: string) => {
      if (!currentUserId) return
      await sendMsgApi(targetConversationId, currentUserId, content, null, forwardedFromId)
    },
    [currentUserId]
  )

  // Realtime channel handlers
  const handleInsert = useCallback(
    (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    },
    [setMessages]
  )
  const handleUpdate = useCallback(
    (updated: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
    },
    [setMessages]
  )
  const handleReadReceipt = useCallback(
    async (r: { message_id: string; user_id: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_active, created_at')
        .eq('id', r.user_id)
        .single()
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === r.message_id)
        if (!msg || msg.conversation_id !== conversationId) return prev
        const readReceipt: ReadReceipt = {
          id: crypto.randomUUID(),
          message_id: r.message_id,
          user_id: r.user_id,
          read_at: new Date().toISOString(),
          profile: profile ?? undefined,
        }
        return prev.map((m) =>
          m.id === r.message_id
            ? { ...m, read_receipts: [...(m.read_receipts ?? []), readReceipt] }
            : m
        )
      })
    },
    [conversationId, setMessages]
  )

  useMessageChannel(conversationId, currentUserId, handleInsert, handleUpdate, handleReadReceipt)

  return {
    messages,
    loading,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    sendWithAttachments,
    forwardMessage,
  }
}

// Re-export helpers for advanced consumers
export { useMessageList, useMessageChannel }
