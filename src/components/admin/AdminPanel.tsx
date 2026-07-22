import { useState } from 'react'
import { useProfiles } from '../../hooks/useProfiles'
import { updateProfile } from '../../lib/profiles'
import Modal from '../ui/Modal'
import Avatar from '../ui/Avatar'
import Spinner from '../ui/Spinner'
import { Shield, ShieldOff, CheckCircle, XCircle, Search } from 'lucide-react'

interface AdminPanelProps {
  open: boolean
  onClose: () => void
}

/**
 * iOS-style admin panel.
 *  - Sheet on mobile, centered card on desktop
 *  - Search field
 *  - Member rows with admin/active toggles
 */
export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const { profiles, loading, search } = useProfiles()
  const [query, setQuery] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const handleSearch = (val: string) => {
    setQuery(val)
    search(val)
  }

  const toggleRole = async (id: string, currentRole: string) => {
    setUpdating(id)
    try {
      await updateProfile(id, { role: currentRole === 'admin' ? 'employee' : 'admin' })
      search(query)
    } catch (e) {
      console.error('Failed to toggle role:', e)
    }
    setUpdating(null)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    setUpdating(id)
    try {
      await updateProfile(id, { is_active: !isActive })
      search(query)
    } catch (e) {
      console.error('Failed to toggle active status:', e)
    }
    setUpdating(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Admin" hideClose variant="centered">
      <div className="p-4">
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
            strokeWidth={2.5}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search employees"
            aria-label="Search users"
            className="h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-[12px] bg-ios-fill-light dark:bg-ios-secondary-dark">
            {profiles.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2.5 ${
                  idx !== profiles.length - 1
                    ? 'border-b border-ios-separator-light dark:border-ios-separator-dark'
                    : ''
                }`}
              >
                <Avatar name={p.full_name} size="md" src={p.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark">
                    {p.full_name}
                  </p>
                  <p className="text-[12px] capitalize text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                    {p.role}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => toggleRole(p.id, p.role)}
                    disabled={updating === p.id}
                    className={`ios-press flex h-8 w-8 items-center justify-center rounded-full active:bg-ios-orange-light/15 ${
                      p.role === 'admin'
                        ? 'text-ios-orange-light dark:text-ios-orange-dark'
                        : 'text-ios-secondary_label-light dark:text-ios-secondary_label-dark'
                    }`}
                    title={p.role === 'admin' ? 'Demote to employee' : 'Promote to admin'}
                    aria-label="Toggle role"
                  >
                    {p.role === 'admin' ? (
                      <Shield className="h-4 w-4" strokeWidth={2.2} />
                    ) : (
                      <ShieldOff className="h-4 w-4" strokeWidth={2.2} />
                    )}
                  </button>
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    disabled={updating === p.id}
                    className={`ios-press flex h-8 w-8 items-center justify-center rounded-full active:bg-ios-fill-light/70 dark:active:bg-ios-fill-dark/70 ${
                      p.is_active
                        ? 'text-ios-green-light dark:text-ios-green-dark'
                        : 'text-ios-red-light dark:text-ios-red-dark'
                    }`}
                    title={p.is_active ? 'Deactivate' : 'Activate'}
                    aria-label="Toggle active status"
                  >
                    {updating === p.id ? (
                      <Spinner size="sm" />
                    ) : p.is_active ? (
                      <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
                    ) : (
                      <XCircle className="h-4 w-4" strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="ios-action-group ios-action-cancel-group">
        <button onClick={onClose} className="ios-action ios-action-cancel">
          <span>Done</span>
        </button>
      </div>
    </Modal>
  )
}
