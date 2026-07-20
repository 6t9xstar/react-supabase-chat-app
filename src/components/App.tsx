import { useState, useEffect } from 'react'
import { getCurrentUser, onAuthStateChange } from '../lib/auth'
import { getProfile } from '../lib/profiles'
import Sidebar from './sidebar/Sidebar'
import ChatWindow from './chat/ChatWindow'
import EmptyState from './chat/EmptyState'
import Spinner from './ui/Spinner'
import AdminPanel from './admin/AdminPanel'
import GroupSettingsModal from './modals/GroupSettingsModal'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false)

  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (!u) { window.location.href = '/login'; return }
      setUser(u)
      const p = await getProfile(u.id)
      setProfile(p)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const sub = onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.href = '/login'
    })
    return () => sub.data.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div class="flex h-screen items-center justify-center bg-gray-50"><Spinner size="lg" /></div>
  }

  return (
    <div class="flex h-screen overflow-hidden">
      {/* Sidebar: always visible on desktop, hidden on mobile when conversation active */}
      <div class={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-80 shrink-0`}>
        <Sidebar
          user={user}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onAdminPanel={() => setAdminPanelOpen(true)}
        />
      </div>
      {/* Main: full width on mobile when conversation active */}
      <main class={`flex-1 flex flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId && user ? (
          <ChatWindow
            conversationId={activeConversationId}
            user={user}
            isAdmin={profile?.role === 'admin'}
            onGroupSettings={() => setGroupSettingsOpen(true)}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      <AdminPanel open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />
      <GroupSettingsModal
        open={groupSettingsOpen}
        onClose={() => setGroupSettingsOpen(false)}
        conversationId={activeConversationId ?? ''}
        currentName=""
        userId={user?.id ?? ''}
      />
    </div>
  )
}
