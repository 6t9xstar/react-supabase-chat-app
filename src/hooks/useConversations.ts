import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getConversations } from '../lib/conversations'
import { getPinnedConversationIds } from '../lib/pinned'
import type { ConversationWithMeta } from '../types/database'

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

function sortPinnedFirst(convs: ConversationWithMeta[]): ConversationWithMeta[] {
  const pinnedIds = new Set(getPinnedConversationIds())
  return [
    ...convs.filter((c) => pinnedIds.has(c.id)),
    ...convs.filter((c) => !pinnedIds.has(c.id)),
  ]
}

/* -------------------------------------------------------------------------- */
/*  useConversationsSidebar                                                   */
/*  List + realtime updates + debounced silent reload                        */
/* -------------------------------------------------------------------------- */

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getConversations(userId)
      setConversations(sortPinnedFirst(data))
    } catch (e) {
      console.error('Failed to load conversations:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const silentReload = useCallback(async () => {
    if (!userId) return
    try {
      const data = await getConversations(userId)
      setConversations(sortPinnedFirst(data))
    } catch (e) {
      console.error('Silent reload failed:', e)
    }
  }, [userId])

  // Initial fetch
  useEffect(() => {
    load()
  }, [load])

  // Realtime channel: subscribe to messages + membership changes
  useEffect(() => {
    if (!userId) return

    let cancelled = false
    let reloadTimer: ReturnType<typeof setTimeout> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    const scheduleSilentReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer)
      reloadTimer = setTimeout(() => {
        silentReload()
      }, 1000)
    }

    ;(async () => {
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId)

      if (cancelled) return

      const convIds = memberships?.map((m) => m.conversation_id) ?? []
      if (convIds.length === 0) return

      channel = supabase
        .channel('sidebar')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=in.(${convIds.join(',')})`,
          },
          () => {
            scheduleSilentReload()
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'conversations' },
          () => {
            scheduleSilentReload()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_members',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            silentReload()
          }
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (reloadTimer) clearTimeout(reloadTimer)
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId, silentReload])

  return { conversations, loading, refresh: load }
}
