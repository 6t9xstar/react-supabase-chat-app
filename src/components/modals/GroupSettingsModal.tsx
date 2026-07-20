import { useState } from 'react'
import { addMember, removeMember, renameGroup, getConversationMembers } from '../../lib/conversations'
import { useProfiles } from '../../hooks/useProfiles'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { Search, Trash2, Loader2, X } from 'lucide-react'

interface GroupSettingsModalProps {
  open: boolean
  onClose: () => void
  conversationId: string
  currentName: string
  userId: string
}

export default function GroupSettingsModal({ open, onClose, conversationId, currentName, userId }: GroupSettingsModalProps) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const { profiles, search: searchProfiles } = useProfiles()

  // Load current members
  useState(() => {
    if (open && conversationId) {
      getConversationMembers(conversationId).then((members) => {
        setMemberIds(members.map((m: any) => m.user_id))
      })
    }
  })

  const handleRename = async () => {
    if (!name.trim() || name === currentName) return
    setSaving(true)
    try { await renameGroup(conversationId, name.trim()) } catch {}
    setSaving(false)
  }

  const handleAddMember = async (profileId: string) => {
    try {
      await addMember(conversationId, profileId)
      setMemberIds((prev) => [...prev, profileId])
    } catch (err) { console.error(err) }
  }

  const handleRemoveMember = async (profileId: string) => {
    try {
      await removeMember(conversationId, profileId)
      setMemberIds((prev) => prev.filter((id) => id !== profileId))
    } catch (err) { console.error(err) }
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    searchProfiles(val)
  }

  return (
    <Modal open={open} onClose={onClose} title="Group Settings">
      <div class="space-y-5">
        {/* Rename */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
          <div class="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <Button onClick={handleRename} disabled={!name.trim() || name === currentName || saving}>
              {saving ? <Loader2 class="h-4 w-4 animate-spin" /> : 'Rename'}
            </Button>
          </div>
        </div>

        {/* Members */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Members ({memberIds.length})</label>
          <div class="relative mb-2">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Add members..."
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
        </div>

        {/* Current members */}
        <div class="max-h-48 overflow-y-auto space-y-1">
          {profiles
            .filter((p) => memberIds.includes(p.id))
            .map((p) => (
              <div key={p.id} class="flex items-center gap-3 rounded-lg px-3 py-2">
                <Avatar name={p.full_name} size="sm" />
                <div class="flex-1 min-w-0">
                  <p class="truncate text-sm font-medium text-gray-900">{p.full_name}</p>
                </div>
                {p.id !== userId && (
                  <button
                    onClick={() => handleRemoveMember(p.id)}
                    class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
        </div>

        {/* Search results (non-members) */}
        {search.trim() && (
          <div class="max-h-48 overflow-y-auto space-y-1 border-t border-gray-100 pt-2">
            {profiles
              .filter((p) => !memberIds.includes(p.id) && p.id !== userId)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddMember(p.id)}
                  class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                >
                  <Avatar name={p.full_name} size="sm" />
                  <p class="text-sm font-medium text-gray-900">{p.full_name}</p>
                </button>
              ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
