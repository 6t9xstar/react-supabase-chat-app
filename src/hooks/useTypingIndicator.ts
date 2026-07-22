import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* -------------------------------------------------------------------------- */
/*  useTypingIndicator                                                        */
/*  Tracks who is currently typing in a conversation via a Supabase Broadcast */
/*  channel. The current user is filtered out so we don't see our own typing. */
/* -------------------------------------------------------------------------- */

const TYPING_AUTO_STOP_MS = 3000

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | undefined
) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const userIdRef = useRef(currentUserId)

  useEffect(() => {
    userIdRef.current = currentUserId
  }, [currentUserId])

  // Open / close channel on conversation change
  useEffect(() => {
    if (!conversationId) return
    setReady(false)

    const channel = supabase.channel(`typing:${conversationId}`)

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { user_id, is_typing } = payload.payload as { user_id: string; is_typing: boolean }
      if (user_id === userIdRef.current) return
      setTypingUserIds((prev) => {
        if (is_typing) return prev.includes(user_id) ? prev : [...prev, user_id]
        return prev.filter((id) => id !== user_id)
      })
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setReady(true)
    })
    channelRef.current = channel

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      setTypingUserIds([])
      setReady(false)
    }
  }, [conversationId])

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const uid = userIdRef.current
      if (!channelRef.current || !uid || !ready) return
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: uid, is_typing: isTyping },
      })

      if (isTyping) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: uid, is_typing: false },
          })
        }, TYPING_AUTO_STOP_MS)
      }
    },
    [ready]
  )

  return { typingUserIds, setTyping }
}
