import { useState } from 'react'
import { useProfiles } from '../../hooks/useProfiles'
import { updateProfile } from '../../lib/profiles'
import Modal from '../ui/Modal'
import Avatar from '../ui/Avatar'
import { Loader2, Shield, ShieldOff, CheckCircle, XCircle } from 'lucide-react'

interface AdminPanelProps {
  open: boolean
  onClose: () => void
}

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
    } catch {}
    setUpdating(null)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    setUpdating(id)
    try {
      await updateProfile(id, { is_active: !isActive })
    } catch {}
    setUpdating(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Admin Panel">
      <div className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <Avatar name={p.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.role}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleRole(p.id, p.role)}
                    disabled={updating === p.id}
                    className={`rounded-lg p-1.5 ${
                      p.role === 'admin'
                        ? 'text-amber-500 hover:bg-amber-50'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
                    }`}
                    title={p.role === 'admin' ? 'Demote to employee' : 'Promote to admin'}
                  >
                    {p.role === 'admin' ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    disabled={updating === p.id}
                    className={`rounded-lg p-1.5 ${
                      p.is_active
                        ? 'text-green-500 hover:bg-green-50'
                        : 'text-red-400 hover:bg-red-50'
                    }`}
                    title={p.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {updating === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : p.is_active ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
