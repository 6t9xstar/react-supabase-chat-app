import { useState, useRef, useCallback } from 'react'
import { MessageSquare, Loader2, Archive } from 'lucide-react'
import ConversationItem from './ConversationItem'
import { isArchived } from '../../lib/archived'
import { ConversationSkeleton } from '../ui/Skeleton'
import type { ConversationWithMeta } from '../../types/database'

interface ConversationListProps {
  conversations: ConversationWithMeta[]
  loading: boolean
  userId: string | undefined
  searchQuery: string
  showArchived?: boolean
  activeConversationId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
}

/**
 * iOS-style conversation list.
 *  - Subtle pull-to-refresh on mobile
 *  - Empty state mirrors iOS Mail (icon + helpful text)
 *  - Pinned section header appears above pinned conversations
 */
export default function ConversationList({
  conversations,
  loading,
  userId,
  searchQuery,
  showArchived = false,
  activeConversationId,
  onSelect,
  onRefresh,
}: ConversationListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pulling, setPulling] = useState(false)
  const pullStartY = useRef(0)
  const pullOffset = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY
      pullOffset.current = 0
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === 0) return
    const dist = Math.max(0, (e.touches[0].clientY - pullStartY.current) * 0.5)
    pullOffset.current = dist
    setPullDistance(dist)
    if (dist > 60) setPulling(true)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullOffset.current > 60) {
      setPulling(true)
      Promise.resolve(onRefresh()).finally(() => {
        setPulling(false)
        setPullDistance(0)
      })
    } else {
      setPullDistance(0)
    }
    pullStartY.current = 0
    pullOffset.current = 0
  }, [onRefresh])

  const filtered = conversations
    .filter((c) => (showArchived ? isArchived(c.id) : !isArchived(c.id)))
    .filter((c) => {
      if (!searchQuery) return true
      const name =
        c.type === 'direct'
          ? c.other_user?.full_name?.toLowerCase() ?? ''
          : c.name?.toLowerCase() ?? ''
      return name.includes(searchQuery.toLowerCase())
    })

  if (loading) return <ConversationSkeleton />

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ios-fill-light dark:bg-ios-fill-dark">
          {showArchived ? (
            <Archive className="h-7 w-7 text-ios-secondary_label-light dark:text-ios-secondary_label-dark" strokeWidth={1.8} />
          ) : (
            <MessageSquare className="h-7 w-7 text-ios-secondary_label-light dark:text-ios-secondary_label-dark" strokeWidth={1.8} />
          )}
        </div>
        <p className="text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark">
          {showArchived ? 'No Archived Chats' : searchQuery ? 'No Results' : 'No Messages'}
        </p>
        <p className="mt-1 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
          {showArchived
            ? 'Archived conversations will appear here.'
            : searchQuery
              ? 'No conversations match your search.'
              : 'Start a new conversation to see it here.'}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="scrollbar-thin flex-1 overflow-y-auto"
      role="list"
    >
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center"
          style={{ height: Math.min(pullDistance, 60) }}
        >
          {pulling ? (
            <Loader2 className="h-4 w-4 animate-spin text-ios-blue-light dark:text-ios-blue-dark" />
          ) : (
            <span className="text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              Pull to refresh
            </span>
          )}
        </div>
      )}
      {filtered.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          onSelect={onSelect}
          currentUserId={userId}
        />
      ))}
      <div className="h-4" />
    </div>
  )
}
