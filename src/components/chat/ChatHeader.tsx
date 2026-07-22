import { useEffect, useState, memo } from 'react'
import { ChevronLeft, Info, Timer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import { formatLastSeen } from '../../lib/formatDate'
import { getConversationTimer, setConversationTimer } from '../../lib/disappearing'
import type { Conversation, Profile } from '../../types/database'
import type { DisappearingTimer } from '../../lib/disappearing'

interface ChatHeaderProps {
  conversationId: string | null
  currentUserId?: string
  onlineUserIds?: string[]
  isAdmin?: boolean
  onGroupSettings?: () => void
  onBack?: () => void
  typingNames?: string[]
}

/**
 * iOS Messages chat header.
 *  - Translucent frosted bar
 *  - Back chevron on mobile
 *  - Centered title + subtitle (typing / online / last seen)
 *  - Trailing info button for group settings
 */
const ChatHeader = memo(function ChatHeader({
  conversationId,
  currentUserId,
  onlineUserIds,
  isAdmin,
  onGroupSettings,
  onBack,
  typingNames,
}: ChatHeaderProps) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [timerOpen, setTimerOpen] = useState(false)
  const timerValue: DisappearingTimer = conversationId
    ? (getConversationTimer(conversationId) as DisappearingTimer)
    : 'off'

  useEffect(() => {
    if (!conversationId) {
      setConv(null)
      setMembers([])
      return
    }
    let cancelled = false

    supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setConv(data ?? null)
      })

    supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .then(async ({ data: memberRows }) => {
        if (!memberRows?.length || cancelled) return
        const ids = memberRows.map((r) => r.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, last_seen_at')
          .in('id', ids)
        if (profiles && !cancelled) {
          // Cast to Profile[] — the selected subset matches Profile's shape
          setMembers(profiles as unknown as Profile[])
        }
      })

    return () => {
      cancelled = true
    }
  }, [conversationId])

  useEffect(() => {
    if (!timerOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-timer-menu]')) setTimerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [timerOpen])

  if (!conv) {
    return (
      <div
        className="ios-blur flex h-[52px] items-center gap-3 border-b border-ios-separator-light bg-ios-bg-light/80 px-3 dark:border-ios-separator-dark dark:bg-ios-grouped-dark/80"
        aria-label="Loading conversation"
      >
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-[10px] bg-ios-fill-light dark:bg-ios-fill-dark" />
        <div className="h-4 w-40 animate-pulse rounded bg-ios-fill-light dark:bg-ios-fill-dark" />
      </div>
    )
  }

  const otherMember = members.find((m) => m.id !== currentUserId)
  const displayName =
    conv.type === 'direct'
      ? otherMember?.full_name || members.map((m) => m.full_name).join(', ') || 'User'
      : conv.name ?? 'Unnamed Group'

  const otherId = otherMember?.id
  const otherOnline = otherId ? (onlineUserIds?.includes(otherId) ?? false) : false
  const groupOnline =
    (onlineUserIds?.length ?? 0) - (currentUserId && onlineUserIds?.includes(currentUserId) ? 1 : 0)
  const lastSeenAt = otherMember?.last_seen_at as string | null | undefined

  return (
    <div className="ios-blur relative flex h-[52px] items-center gap-1 border-b border-ios-separator-light bg-ios-bg-light/75 px-2 dark:border-ios-separator-dark dark:bg-ios-grouped-dark/75">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="ios-press -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/10 dark:text-ios-blue-dark md:hidden"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <button className="ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/10 dark:text-ios-blue-dark md:hidden">
        <Avatar name={displayName} size="sm" src={otherMember?.avatar_url} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2">
        <p className="truncate text-[15px] font-semibold text-ios-label-light dark:text-ios-label-dark">
          {displayName}
        </p>
        <p className="truncate text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
          {typingNames && typingNames.length > 0 ? (
            <span className="text-ios-blue-light dark:text-ios-blue-dark">
              {typingNames.length === 1
                ? `${typingNames[0]} is typing…`
                : typingNames.length === 2
                  ? `${typingNames.join(' and ')} are typing…`
                  : `${typingNames[0]} and ${typingNames.length - 1} others are typing…`}
            </span>
          ) : conv.type === 'group' ? (
            <>
              {members.length} members{groupOnline > 0 ? ` · ${groupOnline} online` : ''}
            </>
          ) : otherOnline ? (
            <span className="text-ios-label-light dark:text-ios-label-dark">Online</span>
          ) : lastSeenAt ? (
            <>Last seen {formatLastSeen(lastSeenAt)}</>
          ) : (
            'Offline'
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        {conv.type === 'group' && isAdmin && (
          <div className="relative" data-timer-menu>
            <button
              onClick={() => setTimerOpen((v) => !v)}
              className={`ios-press flex h-9 w-9 items-center justify-center rounded-full active:bg-ios-fill-light dark:active:bg-ios-fill-dark ${
                timerValue !== 'off'
                  ? 'text-ios-blue-light dark:text-ios-blue-dark'
                  : 'text-ios-blue-light dark:text-ios-blue-dark'
              }`}
              title="Disappearing messages"
              aria-label="Disappearing messages"
            >
              <Timer className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
            {timerOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-ios-lg bg-ios-bg-light shadow-ios-lg dark:bg-ios-secondary-dark animate-ios-pop"
                role="menu"
              >
                {(['off', '1h', '24h', '7d'] as DisappearingTimer[]).map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      if (conversationId) setConversationTimer(conversationId, val)
                      setTimerOpen(false)
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-[15px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark ${
                      timerValue === val
                        ? 'text-ios-blue-light dark:text-ios-blue-dark font-medium'
                        : 'text-ios-label-light dark:text-ios-label-dark'
                    }`}
                    role="menuitem"
                  >
                    {val === 'off' ? 'Off' : val === '1h' ? '1 hour' : val === '24h' ? '24 hours' : '7 days'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {conv.type === 'group' && isAdmin && onGroupSettings && (
          <button
            onClick={onGroupSettings}
            className="ios-press -mr-1 flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/10 dark:text-ios-blue-dark"
            title="Group Info"
            aria-label="Group info"
          >
            <Info className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
})

export default ChatHeader
