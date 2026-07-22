import { useState, useCallback } from 'react'
import { Edit, Archive, ArchiveRestore } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useTheme } from '../../hooks/useTheme'
import { useConversations } from '../../hooks/useConversations'
import ThemeToggle from '../ui/ThemeToggle'
import ConversationList from './ConversationList'
import SearchBar from './SearchBar'
import UserFooter from './UserFooter'
import NewChatModal from '../modals/NewChatModal'

interface SidebarProps {
  user: SupabaseUser | null
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onAdminPanel: () => void
  onEnableNotifications: () => Promise<boolean>
}

/**
 * iOS Messages sidebar (left pane on desktop, full screen on mobile).
 *  - Frosted header with edit + theme toggle
 *  - Search bar
 *  - Pinned / Archived section toggle
 *  - Conversation list (iOS list style)
 *  - Account footer (frosted)
 */
export default function Sidebar({
  user,
  activeConversationId,
  onSelectConversation,
  onAdminPanel,
  onEnableNotifications,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { theme, toggle } = useTheme()
  const { conversations, loading, refresh } = useConversations(user?.id)

  const handleConversationCreated = useCallback(
    (id: string) => {
      onSelectConversation(id)
      refresh()
    },
    [onSelectConversation, refresh]
  )

  return (
    <aside className="flex h-full w-full flex-col bg-ios-grouped-light dark:bg-ios-grouped-dark">
      {/* Header — large title (iOS style) */}
      <div className="flex items-end justify-between gap-2 px-4 pb-2 pt-3">
        <h1 className="text-[34px] font-bold leading-[40px] tracking-tight text-ios-label-light dark:text-ios-label-dark">
          {showArchived ? 'Archive' : 'Messages'}
        </h1>
        <div className="flex items-center gap-0.5">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light hover:bg-ios-blue-light/10 active:bg-ios-blue-light/20 dark:text-ios-blue-dark dark:hover:bg-ios-blue-dark/20"
            title={showArchived ? 'Show active chats' : 'Show archived chats'}
            aria-label={showArchived ? 'Show active chats' : 'Show archived chats'}
          >
            {showArchived ? (
              <ArchiveRestore className="h-[18px] w-[18px]" strokeWidth={2.2} />
            ) : (
              <Archive className="h-[18px] w-[18px]" strokeWidth={2.2} />
            )}
          </button>
          <button
            onClick={() => setNewChatOpen(true)}
            className="ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light hover:bg-ios-blue-light/10 active:bg-ios-blue-light/20 dark:text-ios-blue-dark dark:hover:bg-ios-blue-dark/20"
            title="New Chat"
            aria-label="New chat"
          >
            <Edit className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <SearchBar
        userId={user?.id}
        value={searchQuery}
        onChange={setSearchQuery}
        onSelectResult={onSelectConversation}
      />

      <ConversationList
        conversations={conversations}
        loading={loading}
        userId={user?.id}
        searchQuery={searchQuery}
        showArchived={showArchived}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
        onRefresh={refresh}
      />

      <UserFooter user={user} onAdminPanel={onAdminPanel} onEnableNotifications={onEnableNotifications} />

      {user && (
        <NewChatModal
          open={newChatOpen}
          onClose={() => setNewChatOpen(false)}
          userId={user.id}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </aside>
  )
}
