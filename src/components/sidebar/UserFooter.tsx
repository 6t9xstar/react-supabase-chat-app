import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LogOut, Settings, MessageSquarePlus } from 'lucide-react'
import { signOut } from '../../lib/auth'
import { getProfile } from '../../lib/profiles'
import Avatar from '../ui/Avatar'
import type { Profile } from '../../types/database'

interface UserFooterProps {
  user: SupabaseUser | null
  onAdminPanel: () => void
}

export default function UserFooter({ user, onAdminPanel }: UserFooterProps) {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (user?.id) getProfile(user.id).then(setProfile)
  }, [user?.id])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const isAdmin = profile?.role === 'admin'

  return (
    <div class="border-t border-gray-100 px-4 py-3">
      <div class="flex items-center gap-3">
        <Avatar name={displayName} size="sm" />
        <div class="flex-1 min-w-0">
          <p class="truncate text-sm font-medium text-gray-900">{displayName}</p>
          <p class="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <div class="flex gap-1">
          {isAdmin && (
            <button
              onClick={onAdminPanel}
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"
              title="Admin Panel"
            >
              <Settings class="h-4 w-4" />
            </button>
          )}
          <button
            onClick={async () => { await signOut() }}
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
            title="Sign out"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
