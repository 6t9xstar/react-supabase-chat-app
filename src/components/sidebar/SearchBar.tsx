import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useSearch } from '../../hooks/useSearch'
import { formatDistanceToNow } from '../../lib/formatDate'

interface SearchBarProps {
  userId: string | undefined
  value: string
  onChange: (value: string) => void
  onSelectResult?: (conversationId: string) => void
}

/**
 * iOS-style search field:
 *  - Round, gray, sits at the top of the conversation list
 *  - Cancel pill appears when focused (mobile)
 *  - Result dropdown uses a rounded card with hairline separators
 */
export default function SearchBar({ userId, value, onChange, onSelectResult }: SearchBarProps) {
  const [focused, setFocused] = useState(false)
  const { results, loading } = useSearch(userId, value)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="px-3 pt-2 pb-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
            strokeWidth={2.5}
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search"
            aria-label="Search messages"
            className="h-9 w-full rounded-[10px] bg-ios-fill-light pl-9 pr-9 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-fill-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ios-secondary_label-light dark:text-ios-secondary_label-dark" />
          )}
          {!loading && value.trim() && (
            <button
              onClick={() => {
                onChange('')
                inputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-ios-secondary_label-light text-white active:opacity-70 dark:bg-ios-secondary_label-dark"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {focused && value.trim() && (
        <div className="mt-2 overflow-hidden rounded-ios-lg bg-ios-bg-light shadow-ios dark:bg-ios-secondary-dark">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-[15px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              No messages found
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={`${r.conversation_id}-${i}`}
                  onClick={() => {
                    onSelectResult?.(r.conversation_id)
                    setFocused(false)
                    onChange('')
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-ios-fill-light dark:active:bg-ios-fill-dark"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ios-blue-light/15 dark:bg-ios-blue-dark/25">
                    <Search className="h-3.5 w-3.5 text-ios-blue-light dark:text-ios-blue-dark" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[15px] text-ios-label-light dark:text-ios-label-dark">
                      {r.content}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                      {formatDistanceToNow(r.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
