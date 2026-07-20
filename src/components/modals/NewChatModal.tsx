import { useState } from 'react'
import { createGroupConversation, findOrCreateDirectConversation } from '../../lib/conversations'
import { useProfiles } from '../../hooks/useProfiles'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { Search, Loader2 } from 'lucide-react'

interface NewChatModalProps {
  open: boolean
  onClose: () => void
  userId: string
  onConversationCreated: (id: string) => void
}

export default function NewChatModal({ open, onClose, userId, onConversationCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<'direct' | 'group' | null>(null)
  const [groupName, setGroupName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const { profiles, search: searchProfiles } = useProfiles()

  const handleSearch = (val: string) => {
    setSearch(val)
    searchProfiles(val)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    try {
      if (mode === 'direct' && selectedIds.length === 1) {
        const convId = await findOrCreateDirectConversation(userId, selectedIds[0])
        onConversationCreated(convId)
      } else if (mode === 'group' && groupName.trim() && selectedIds.length > 0) {
        const convId = await createGroupConversation(groupName.trim(), userId, selectedIds)
        onConversationCreated(convId)
      }
      onClose()
    } catch (err) {
      console.error('Failed to create conversation:', err)
    } finally {
      setCreating(false)
    }
  }

  const reset = () => {
    setMode(null)
    setGroupName('')
    setSelectedIds([])
    setSearch('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!mode) {
    return (
      <Modal open={open} onClose={handleClose} title="New Chat">
        <div className="space-y-3">
          <button
            onClick={() => setMode('direct')}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Direct Message</p>
              <p className="text-xs text-gray-500">Chat with another employee</p>
            </div>
          </button>
          <button
            onClick={() => setMode('group')}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <span className="text-lg">👥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Group Chat</p>
              <p className="text-xs text-gray-500">Create a team conversation</p>
            </div>
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={mode === 'group' ? 'Create Group' : 'New Direct Message'}>
      <div className="space-y-4">
        {mode === 'group' && (
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {profiles
            .filter((p) => p.id !== userId)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-50 ${
                  selectedIds.includes(p.id) ? 'bg-brand-50' : ''
                }`}
              >
                <Avatar name={p.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-gray-500">{p.email ?? p.role}</p>
                </div>
                {selectedIds.includes(p.id) && (
                  <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
              </button>
            ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => setMode(null)}>Back</Button>
          <Button
            onClick={handleCreate}
            disabled={
              creating ||
              (mode === 'direct' && selectedIds.length !== 1) ||
              (mode === 'group' && (!groupName.trim() || selectedIds.length === 0))
            }
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'group' ? 'Create Group' : 'Start Chat')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
