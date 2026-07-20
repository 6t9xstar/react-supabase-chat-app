import { useState, useEffect, useRef } from 'react'
import { searchMessages } from '../lib/messages'
import type { Message } from '../types/database'

interface SearchResult {
  conversation_id: string
  content: string
  created_at: string
  sender_id: string
}

export function useSearch(userId: string | undefined, query: string) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!userId || !query.trim()) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const data = await searchMessages(userId, query)
      setResults(data)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [userId, query])

  return { results, loading }
}
