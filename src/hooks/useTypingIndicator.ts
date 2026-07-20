import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTypingIndicator(conversationId: string | null, currentUserId: string | undefined) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase.channel(`typing:${conversationId}`)

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { user_id, is_typing } = payload.payload
      if (user_id === currentUserId) return
      setTypingUserIds((prev) => {
        if (is_typing) return prev.includes(user_id) ? prev : [...prev, user_id]
        return prev.filter((id) => id !== user_id)
      })
    })

    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [conversationId, currentUserId])

  const setTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, is_typing },
    })

    if (isTyping) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUserId, is_typing: false },
        })
      }, 3000)
    }
  }, [currentUserId])

  return { typingUserIds, setTyping }
}
