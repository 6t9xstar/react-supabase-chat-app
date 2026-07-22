import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'

interface NotificationOptions {
  userId: string
  /** Currently viewed conversation ID — don't notify for this one */
  activeConversationId: string | null
  /** Whether to auto-request permission on first message */
  autoRequest?: boolean
}

async function fetchSenderName(senderId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', senderId)
    .single()
  return data?.full_name ?? 'Someone'
}

/* -------------------------------------------------------------------------- */
/*  useNotifications                                                          */
/*  Listens for new messages and shows a desktop notification. Silenced for   */
/*  the currently-active conversation, the user's own messages, and when the  */
/*  tab is visible.                                                           */
/* -------------------------------------------------------------------------- */

export function useNotifications({ userId, activeConversationId, autoRequest = false }: NotificationOptions) {
  const permissionRequested = useRef(false)
  const convIdRef = useRef(activeConversationId)
  convIdRef.current = activeConversationId

  // Exposed so the UI can gate permission behind an explicit user action
  // instead of popping a permission dialog on the first incoming message.
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const permission = getNotificationPermission()
    if (permission === 'granted' || permission === 'denied' || permission === 'unsupported') {
      return permission === 'granted'
    }
    try {
      const granted = await requestNotificationPermission()
      if (granted) permissionRequested.current = true
      return granted
    } catch (e) {
      console.error('Notification permission request failed:', e)
      return false
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false;

    (async () => {
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId)

      if (cancelled) return
      const convIds = memberships?.map((m) => m.conversation_id) ?? []
      if (convIds.length === 0) return

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=in.(${convIds.join(',')})`,
          },
          async (payload) => {
          if (cancelled) return
          const msg = payload.new as {
            id: string
            conversation_id: string
            sender_id: string
            content: string | null
          }
          if (msg.sender_id === userId) return
          if (msg.conversation_id === convIdRef.current && !document.hidden) return

          const permission = getNotificationPermission()
          if (permission === 'denied' || permission === 'unsupported') return
          if (permission === 'default') {
            if (!autoRequest || permissionRequested.current) return
            permissionRequested.current = true
            const granted = await requestPermission()
            if (!granted) return
          }

          const senderName = await fetchSenderName(msg.sender_id)
          if (cancelled) return
          try {
            const notification = new Notification(senderName, {
              body: msg.content || 'Sent an attachment',
              icon: '/favicon.svg',
              tag: msg.conversation_id,
              data: { conversationId: msg.conversation_id },
            })

            notification.onclick = () => {
              window.focus()
              window.dispatchEvent(
                new CustomEvent('notification-click', { detail: msg.conversation_id })
              )
              notification.close()
            }
          } catch (e) {
            console.error('Failed to show notification:', e)
          }
        }
      )
      .subscribe()

      return () => {
        cancelled = true
        supabase.removeChannel(channel)
      }
    })()
  }, [userId, autoRequest, requestPermission])

  return { requestPermission }
}
