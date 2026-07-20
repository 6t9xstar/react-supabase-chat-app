import { useState } from 'react'
import { MessageCircle, MessageSquarePlus } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import ConversationList from './ConversationList'
import SearchBar from './SearchBar'
import UserFooter from './UserFooter'
import NewChatModal from '../modals/NewChatModal'

interface SidebarProps {
  user: SupabaseUser | null
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onAdminPanel: () => void
}

export default function Sidebar({ user, activeConversationId, onSelectConversation, onAdminPanel }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)

  return (
    <aside class="flex w-80 flex-col border-r border-gray-200 bg-white">
      <div class="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <MessageCircle class="h-5 w-5 text-white" />
        </div>
        <div class="flex-1">
          <h1 class="text-sm font-bold text-gray-900">Apex Chat</h1>
          <p class="text-xs text-gray-500">Internal</p>
        </div>
        <button
          onClick={() => setNewChatOpen(true)}
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"
          title="New Chat"
        >
          <MessageSquarePlus class="h-5 w-5" />
        </button>
      </div>

      <SearchBar
        userId={user?.id}
        value={searchQuery}
        onChange={setSearchQuery}
        onSelectResult={onSelectConversation}
      />

      <div class="flex-1 overflow-y-auto scrollbar-thin">
        <ConversationList
          userId={user?.id}
          searchQuery={searchQuery}
          activeConversationId={activeConversationId}
          onSelect={onSelectConversation}
        />
      </div>

      <UserFooter user={user} onAdminPanel={onAdminPanel} />

      {user && (
        <NewChatModal
          open={newChatOpen}
          onClose={() => setNewChatOpen(false)}
          userId={user.id}
          onConversationCreated={onSelectConversation}
        />
      )}
    </aside>
  )
}
