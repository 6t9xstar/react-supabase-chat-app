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
    <div className="border-t border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <div className="flex gap-1">
          {isAdmin && (
            <button
              onClick={onAdminPanel}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"
              title="Admin Panel"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={async () => { await signOut() }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
