import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LogOut, Settings, Bell, BellOff } from 'lucide-react'
import { signOut } from '../../lib/auth'
import { getProfile } from '../../lib/profiles'
import { getNotificationPermission } from '../../lib/notifications'
import Avatar from '../ui/Avatar'
import type { Profile } from '../../types/database'

interface UserFooterProps {
  user: SupabaseUser | null
  onAdminPanel: () => void
  onEnableNotifications: () => Promise<boolean>
}

/**
 * iOS Settings-style account footer.
 *  - Card-style row with avatar, name, email
 *  - Trailing buttons (settings, notif, signout) as small icons
 */
export default function UserFooter({ user, onAdminPanel, onEnableNotifications }: UserFooterProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifPermission, setNotifPermission] = useState<
    'default' | 'granted' | 'denied' | 'unsupported'
  >(typeof window !== 'undefined' ? getNotificationPermission() : 'unsupported')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getProfile(user.id).then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleEnableNotifications = async () => {
    const granted = await onEnableNotifications()
    setNotifPermission(granted ? 'granted' : getNotificationPermission())
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="border-t border-ios-separator-light bg-ios-bg-light/60 px-3 py-2 backdrop-blur-md dark:border-ios-separator-dark dark:bg-ios-grouped-dark/60">
      <div className="flex items-center gap-3 rounded-ios-lg bg-ios-fill-light/60 p-2 dark:bg-ios-secondary-dark">
        <Avatar name={displayName} size="md" src={profile?.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ios-label-light dark:text-ios-label-dark">
            {displayName}
          </p>
          <p className="truncate text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
            {user?.email}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {notifPermission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              className="ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-secondary_label-light hover:bg-ios-fill-light active:bg-ios-fill-light/70 dark:text-ios-secondary_label-dark dark:hover:bg-ios-fill-dark"
              title="Enable notifications"
              aria-label="Enable notifications"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          )}
          {notifPermission === 'denied' && (
            <span
              className="flex h-9 w-9 items-center justify-center text-ios-tertiary_label-light dark:text-ios-tertiary_label-dark"
              title="Notifications blocked in browser settings"
              aria-label="Notifications blocked"
            >
              <BellOff className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
          )}
          {isAdmin && (
            <button
              onClick={onAdminPanel}
              className="ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-secondary_label-light hover:bg-ios-fill-light active:bg-ios-fill-light/70 dark:text-ios-secondary_label-dark dark:hover:bg-ios-fill-dark"
              title="Admin Panel"
              aria-label="Admin panel"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          )}
          <button
            onClick={async () => {
              await signOut()
            }}
            className="ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-red-light hover:bg-ios-red-light/12 active:bg-ios-red-light/20 dark:text-ios-red-dark"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
