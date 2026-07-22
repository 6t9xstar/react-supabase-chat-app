import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import type { ConversationWithMeta } from '../../types/database'

interface ForwardModalProps {
  open: boolean
  onClose: () => void
  userId: string
  onForward: (targetConversationId: string) => void
}

/**
 * iOS-style forward modal.
 *  - Bottom sheet with grabber
 *  - Search field
 *  - Scrollable list of conversations (avatar + name)
 */
export default function ForwardModal({ open, onClose, userId, onForward }: ForwardModalProps) {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({})
  const [avatars, setAvatars] = useState<Record<string, string | null>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId)
      if (cancelled || !memberships?.length) return
      const ids = memberships.map((m) => m.conversation_id)
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .in('id', ids)
        .order('updated_at', { ascending: false })
      if (!convs || cancelled) return
      setConversations(convs as ConversationWithMeta[])

      const dmConvs = convs.filter((c) => c.type === 'direct')
      if (dmConvs.length > 0) {
        const { data: dmMembers } = await supabase
          .from('conversation_members')
          .select('conversation_id, user_id')
          .in('conversation_id', dmConvs.map((c) => c.id))
          .neq('user_id', userId)
        if (dmMembers) {
          const otherIds = [...new Set(dmMembers.map((m) => m.user_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', otherIds)
          if (profiles) {
            const nameMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]))
            const avatarMap = Object.fromEntries(profiles.map((p) => [p.id, p.avatar_url]))
            const names: Record<string, string> = {}
            const avs: Record<string, string | null> = {}
            for (const m of dmMembers) {
              names[m.conversation_id] = nameMap[m.user_id] || 'User'
              avs[m.conversation_id] = avatarMap[m.user_id] || null
            }
            if (!cancelled) {
              setDisplayNames(names)
              setAvatars(avs)
            }
          }
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, userId])

  if (!open) return null

  const filtered = search
    ? conversations.filter((c) => {
        const name = c.name ?? displayNames[c.id] ?? ''
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-ios-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-h-[85dvh] overflow-hidden rounded-t-ios-xl bg-ios-bg-light shadow-ios-sheet dark:bg-ios-grouped-dark animate-ios-slide-up">
        <div className="ios-sheet-grabber" aria-hidden />

        <div className="px-4 pb-1 pt-1 text-center">
          <h2 className="text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark">
            Forward to…
          </h2>
        </div>

        <div className="px-4 py-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              autoFocus
              className="h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
              aria-label="Search conversations"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-2 pb-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              {search ? 'No conversations found' : 'No conversations yet'}
            </p>
          ) : (
            filtered.map((conv) => {
              const name = displayNames[conv.id] || conv.name || 'Unnamed'
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    onForward(conv.id)
                    onClose()
                  }}
                  className="ios-press flex w-full items-center gap-3 rounded-[10px] px-2 py-2 active:bg-ios-fill-light dark:active:bg-ios-fill-dark"
                >
                  <Avatar name={name} size="md" src={avatars[conv.id]} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark">
                      {name}
                    </p>
                    <p className="text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                      {conv.type === 'group' ? 'Group' : 'Direct Message'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="ios-action-group ios-action-cancel-group">
          <button onClick={onClose} className="ios-action ios-action-cancel">
            <span>Cancel</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
