import { useEffect, useState } from 'react'
import { Settings, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import type { Conversation, Profile } from '../../types/database'

interface ChatHeaderProps {
  conversationId: string | null
  currentUserId?: string
  onlineUserIds?: string[]
  isAdmin?: boolean
  onGroupSettings?: () => void
  onBack?: () => void
}

export default function ChatHeader({ conversationId, currentUserId, onlineUserIds, isAdmin, onGroupSettings, onBack }: ChatHeaderProps) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [members, setMembers] = useState<Profile[]>([])

  useEffect(() => {
    if (!conversationId) return

    supabase.from('conversations').select('*').eq('id', conversationId).single()
      .then(({ data }) => setConv(data))

    supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .then(async ({ data: memberRows }) => {
        if (!memberRows?.length) return
        const ids = memberRows.map((r) => r.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', ids)
        if (profiles) setMembers(profiles)
      })
  }, [conversationId])

  if (!conv) {
    return (
      <div class="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <div class="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        <div class="h-4 w-40 animate-pulse rounded bg-gray-200" />
      </div>
    )
  }

  const displayName = conv.type === 'direct'
    ? members.find((m) => m.id !== currentUserId)?.full_name ?? members.map(m => m.full_name).join(', ')
    : (conv.name ?? 'Unnamed Group')

  const onlineCount = conv.type === 'direct'
    ? (onlineUserIds?.some((id) => members.find((m) => m.id !== currentUserId)?.id === id) ? 1 : 0)
    : (onlineUserIds?.length ?? 0)

  return (
    <div class="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
      {onBack && (
        <button onClick={onBack} class="md:hidden rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft class="h-5 w-5" />
        </button>
      )}
      <Avatar name={displayName} size="md" />
      <div class="flex-1">
        <p class="text-sm font-semibold text-gray-900">{displayName}</p>
        <p class="text-xs text-gray-500">
          {conv.type === 'group'
            ? `${members.length} members${onlineCount > 0 ? ` · ${onlineCount} online` : ''}`
            : onlineCount > 0 ? 'Online' : 'Offline'}
        </p>
      </div>
      {conv.type === 'group' && isAdmin && onGroupSettings && (
        <button
          onClick={onGroupSettings}
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"
          title="Group Settings"
        >
          <Settings class="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
