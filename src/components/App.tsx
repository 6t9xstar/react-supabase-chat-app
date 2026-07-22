import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentUser, onAuthStateChange } from '../lib/auth'
import { getProfile, updateLastSeen } from '../lib/profiles'
import { useNotifications } from '../hooks/useNotifications'
import Sidebar from './sidebar/Sidebar'
import ChatWindow from './chat/ChatWindow'
import EmptyState from './chat/EmptyState'
import Spinner from './ui/Spinner'
import AdminPanel from './admin/AdminPanel'
import GroupSettingsModal from './modals/GroupSettingsModal'
import ErrorBoundary from './ErrorBoundary'
import { supabase } from '../lib/supabase'
import { WifiOff } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [activeConversationName, setActiveConversationName] = useState('')
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const prevConvIdRef = useRef<string | null>(null)

  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (!u) {
        window.location.href = '/login'
        return
      }
      setUser(u)
      try {
        const p = await getProfile(u.id)
        setProfile(p)
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const sub = onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    })
    return () => sub.data?.subscription?.unsubscribe()
  }, [])

  // Conversation name for group settings modal
  useEffect(() => {
    if (prevConvIdRef.current === activeConversationId) return
    prevConvIdRef.current = activeConversationId
    
    if (!activeConversationId) return
    supabase
      .from('conversations')
      .select('name')
      .eq('id', activeConversationId)
      .single()
      .then(({ data }) => setActiveConversationName(data?.name ?? ''))
  }, [activeConversationId])

  const { requestPermission } = useNotifications({
    userId: user?.id ?? '',
    activeConversationId,
    autoRequest: false,
  })

  // Notification click → switch to that conversation
  const onNotificationClick = useCallback((e: Event) => {
    const convId = (e as CustomEvent).detail
    if (convId) setActiveConversationId(convId)
  }, [])

  useEffect(() => {
    window.addEventListener('notification-click', onNotificationClick)
    return () => window.removeEventListener('notification-click', onNotificationClick)
  }, [onNotificationClick])

  // Heartbeat: keep last_seen_at fresh so other users see an accurate
  // "Last seen…" instead of a permanent "Offline". Updates on mount, on a
  // 60s interval, and whenever the tab becomes hidden.
  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    updateLastSeen(uid)
    const interval = setInterval(() => updateLastSeen(uid), 60000)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') updateLastSeen(uid)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user?.id])

  // Online/offline banner
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ESC → close active conversation (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') setActiveConversationId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-ios-grouped-light dark:bg-black">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ios-grouped-light dark:bg-black">
      {!online && (
        <div className="flex shrink-0 items-center justify-center gap-2 bg-ios-red-light px-4 py-1.5 text-[12px] font-medium text-white dark:bg-ios-red-dark">
          <WifiOff className="h-3.5 w-3.5" />
          No internet connection
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile when chat is open, always visible on desktop */}
        <ErrorBoundary>
          <div
            className={`${
              activeConversationId ? 'hidden md:flex' : 'flex'
            } w-full shrink-0 flex-col overflow-hidden border-r border-ios-separator-light bg-ios-grouped-light md:w-[340px] md:flex dark:border-ios-separator-dark dark:bg-ios-grouped-dark`}
          >
            <Sidebar
              user={user}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onAdminPanel={() => setAdminPanelOpen(true)}
              onEnableNotifications={requestPermission}
            />
          </div>
        </ErrorBoundary>

        {/* Chat pane — visible on mobile only when a conversation is open */}
        <ErrorBoundary>
          <div
            className={`${
              activeConversationId ? 'flex' : 'hidden md:flex'
            } w-full flex-1 flex-col overflow-hidden bg-ios-bg-light chat-area dark:bg-ios-grouped-dark`}
          >
            {activeConversationId && user ? (
              <div className="flex h-full flex-1 animate-ios-fade">
                <ChatWindow
                  conversationId={activeConversationId}
                  user={user}
                  isAdmin={profile?.role === 'admin'}
                  onGroupSettings={() => setGroupSettingsOpen(true)}
                  onBack={() => setActiveConversationId(null)}
                />
              </div>
            ) : (
              <div className="flex h-full flex-1 animate-ios-fade">
                <EmptyState />
              </div>
            )}
          </div>
        </ErrorBoundary>

        <AdminPanel open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />
        <GroupSettingsModal
          open={groupSettingsOpen}
          onClose={() => setGroupSettingsOpen(false)}
          conversationId={activeConversationId ?? ''}
          currentName={activeConversationName}
          userId={user?.id ?? ''}
          onRename={(newName) => setActiveConversationName(newName)}
        />
      </div>
    </div>
  )
}
