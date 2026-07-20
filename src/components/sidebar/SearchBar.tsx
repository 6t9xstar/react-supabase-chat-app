import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, MessageSquare } from 'lucide-react'
import { useSearch } from '../../hooks/useSearch'
import { formatDistanceToNow } from '../../lib/formatDate'

interface SearchBarProps {
  userId: string | undefined
  value: string
  onChange: (value: string) => void
  onSelectResult?: (conversationId: string) => void
}

export default function SearchBar({ userId, value, onChange, onSelectResult }: SearchBarProps) {
  const [focused, setFocused] = useState(false)
  const { results, loading } = useSearch(userId, value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="px-4 py-3 relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search conversations..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>

      {focused && value.trim() && (
        <div className="absolute left-4 right-4 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-gray-500">No messages found</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.conversation_id}-${i}`}
              onClick={() => { onSelectResult?.(r.conversation_id); setFocused(false); onChange('') }}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">{r.content}</p>
                <p className="text-xs text-gray-500">{formatDistanceToNow(r.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
