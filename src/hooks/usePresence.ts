import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/* -------------------------------------------------------------------------- */
/*  usePresence                                                               */
/*  Track which users in a conversation are currently online. Uses Supabase   */
/*  Presence (CRDT). Auto-rejoins on tab focus. Excludes the current user.    */
/* -------------------------------------------------------------------------- */

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
        .map((p) => (p as { user_id: string }).user_id)
        .filter((id: string) => id !== currentUserId)
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
      setOnlineUserIds([])
    }
  }, [conversationId, currentUserId])

  return { onlineUserIds }
}
