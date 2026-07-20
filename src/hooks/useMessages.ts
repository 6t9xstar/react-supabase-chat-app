import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getMessages, sendMessage as sendMsgApi } from '../lib/messages'
import type { Message } from '../types/database'

export function useMessages(conversationId: string | null, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastSendRef = useRef(0)

  const loadInitial = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    const { messages: msgs, hasMore: more } = await getMessages(conversationId)
    setMessages(msgs)
    setHasMore(more)
    setLoading(false)
  }, [conversationId])

  const loadMore = useCallback(async () => {
    if (!conversationId || !messages.length || !hasMore) return
    const oldest = messages[0]
    const { messages: older, hasMore: more } = await getMessages(conversationId, oldest.created_at)
    setMessages((prev) => [...older, ...prev])
    setHasMore(more)
  }, [conversationId, messages, hasMore])

  // Load initial messages
  useEffect(() => {
    setMessages([])
    setHasMore(true)
    loadInitial()
  }, [loadInitial])

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id === currentUserId) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [conversationId, currentUserId])

  const sendMessage = useCallback(async (content: string, replyToId?: string | null) => {
    if (!conversationId || !currentUserId || !content.trim()) return

    const tempId = crypto.randomUUID()
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      reply_to_id: replyToId ?? null,
      is_edited: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending',
    }

    setMessages((prev) => [...prev, optimistic])
    setSending(true)

    try {
      const saved = await sendMsgApi(conversationId, currentUserId, content, replyToId)
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...saved, status: 'sent' } : m)
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, status: 'failed' } : m)
      )
    } finally {
      setSending(false)
    }
  }, [conversationId, currentUserId])

  const sendWithAttachments = useCallback(async (
    content: string,
    attachments: { storage_path: string; original_name: string; mime_type: string; extension: string; file_size: number }[],
    replyToId?: string | null
  ) => {
    if (!conversationId || !currentUserId) return

    const now = Date.now()
    if (now - lastSendRef.current < 200) return
    lastSendRef.current = now

    const tempId = crypto.randomUUID()
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content || null,
      reply_to_id: replyToId ?? null,
      is_edited: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending',
    }

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
          reply_to_id: replyToId ?? null,
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
        prev.map((m) => m.id === tempId ? { ...(message as unknown as Message), status: 'sent' } : m)
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, status: 'failed' } : m)
      )
    } finally {
      setSending(false)
    }
  }, [conversationId, currentUserId])

  return { messages, loading, hasMore, sending, loadMore, sendMessage, sendWithAttachments }
}
