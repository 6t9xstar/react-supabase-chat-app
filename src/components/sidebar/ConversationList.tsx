import { MessageSquare } from 'lucide-react'
import { useConversations } from '../../hooks/useConversations'
import ConversationItem from './ConversationItem'

interface ConversationListProps {
  userId: string | undefined
  searchQuery: string
  activeConversationId: string | null
  onSelect: (id: string) => void
}

export default function ConversationList({ userId, searchQuery, activeConversationId, onSelect }: ConversationListProps) {
  const { conversations, loading } = useConversations(userId)

  const filtered = searchQuery
    ? conversations.filter((c) => {
        const name = c.type === 'direct'
          ? c.other_user?.full_name?.toLowerCase() ?? ''
          : c.name?.toLowerCase() ?? ''
        return name.includes(searchQuery.toLowerCase())
      })
    : conversations

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">
          {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {filtered.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
