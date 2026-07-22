import { useState, useEffect, useRef } from 'react'
import { searchMessages } from '../lib/messages'

/* -------------------------------------------------------------------------- */
/*  useSearch                                                                 */
/*  Debounced (300ms) full-text search across all of a user's messages.       */
/* -------------------------------------------------------------------------- */

interface SearchResult {
  conversation_id: string
  content: string
  created_at: string
  sender_id: string
}

const DEBOUNCE_MS = 300

export function useSearch(userId: string | undefined, query: string) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const performSearch = async () => {
      if (!userId || !query.trim()) {
        if (!cancelled) setResults([])
        return
      }

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const data = await searchMessages(userId, query)
          if (!cancelled) setResults(data)
        } catch (e) {
          console.error('Failed to search messages:', e)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }, DEBOUNCE_MS)
    }
    
    performSearch()

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [userId, query])

  return { results, loading }
}
