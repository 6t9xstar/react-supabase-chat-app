import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getConversations } from '../lib/conversations'
import type { ConversationWithMeta } from '../types/database'

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await getConversations(userId)
    setConversations(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('sidebar')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { load() }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { load() }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${userId}` },
        () => { load() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, load])

  return { conversations, loading, refresh: load }
}
