import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function usePresence(conversationId: string | null, currentUserId: string | undefined) {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const userIds = Object.values(state)
        .flat()
        .map((p: any) => p.user_id)
      setOnlineUserIds(userIds)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        })
      }
    })

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  return { onlineUserIds }
}
