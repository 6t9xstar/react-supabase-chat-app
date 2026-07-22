import { useState } from 'react'
import { createGroupConversation, findOrCreateDirectConversation } from '../../lib/conversations'
import { useProfiles } from '../../hooks/useProfiles'
import Modal from '../ui/Modal'
import Avatar from '../ui/Avatar'
import { Search, Loader2, MessageCircle, Users, ChevronRight, Check } from 'lucide-react'

interface NewChatModalProps {
  open: boolean
  onClose: () => void
  userId: string
  onConversationCreated: (id: string) => void
}

/**
 * iOS-style new chat flow.
 *  - Mode picker: "New Message" vs "New Group" (card list with chevrons)
 *  - Member search & multi-select with iOS-style checkmarks
 *  - Group name input
 */
export default function NewChatModal({ open, onClose, userId, onConversationCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<'direct' | 'group' | null>(null)
  const [groupName, setGroupName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const { profiles, search: searchProfiles } = useProfiles(userId)

  const handleSearch = (val: string) => {
    setSearch(val)
    searchProfiles(val)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
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
      <Modal open={open} onClose={handleClose} title="New Chat" hideClose>
        <div className="space-y-2 p-4">
          <button
            onClick={() => setMode('direct')}
            className="ios-press flex w-full items-center gap-3 rounded-ios-lg bg-ios-fill-light p-3 active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:active:bg-ios-secondary-dark/70"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ios-blue-light text-white dark:bg-ios-blue-dark">
              <MessageCircle className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark">
                New Message
              </p>
              <p className="text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                Chat with a single person
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-ios-tertiary_label-light dark:text-ios-tertiary_label-dark" strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setMode('group')}
            className="ios-press flex w-full items-center gap-3 rounded-ios-lg bg-ios-fill-light p-3 active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:active:bg-ios-secondary-dark/70"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ios-green-light text-white dark:bg-ios-green-dark">
              <Users className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark">
                New Group
              </p>
              <p className="text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                Start a team conversation
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-ios-tertiary_label-light dark:text-ios-tertiary_label-dark" strokeWidth={2.5} />
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === 'group' ? 'New Group' : 'New Message'}
      hideClose
    >
      <div className="p-4">
        {mode === 'group' && (
          <div className="mb-3">
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              Group name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Marketing Team"
              className="h-10 w-full rounded-[10px] bg-ios-fill-light px-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
            />
          </div>
        )}

        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
          {mode === 'group' ? 'To:' : 'Send to'}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
            strokeWidth={2.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search people"
            aria-label="Search employees"
            className="h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const p = profiles.find((x) => x.id === id)
              return (
                <span
                  key={id}
                  className="ios-press flex items-center gap-1.5 rounded-full bg-ios-blue-light py-0.5 pl-0.5 pr-2 text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
                >
                  <Avatar name={p?.full_name ?? '?'} size="xs" src={p?.avatar_url} />
                  <span className="text-[12px] font-medium">{p?.full_name ?? 'User'}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto px-2 pb-2">
        {profiles
          .filter((p) => p.id !== userId)
          .map((p) => {
            const selected = selectedIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className="ios-press flex w-full items-center gap-3 rounded-[10px] px-2 py-2 active:bg-ios-fill-light dark:active:bg-ios-fill-dark"
              >
                <Avatar name={p.full_name} size="md" src={p.avatar_url} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark">
                    {p.full_name}
                  </p>
                  <p className="truncate text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                    {p.email ?? p.role}
                  </p>
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selected
                      ? 'border-ios-blue-light bg-ios-blue-light dark:border-ios-blue-dark dark:bg-ios-blue-dark'
                      : 'border-ios-tertiary_label-light dark:border-ios-tertiary_label-dark'
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
      </div>

      <div className="border-t border-ios-separator-light p-4 dark:border-ios-separator-dark">
        <div className="flex gap-2">
          <button
            onClick={() => setMode(null)}
            className="ios-press flex-1 rounded-[10px] bg-ios-fill-light py-2.5 text-[15px] font-medium text-ios-label-light active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:text-ios-label-dark"
          >
            Back
          </button>
          <button
            onClick={handleCreate}
            disabled={
              creating ||
              (mode === 'direct' && selectedIds.length !== 1) ||
              (mode === 'group' && (!groupName.trim() || selectedIds.length === 0))
            }
            className="ios-press flex flex-1 items-center justify-center rounded-[10px] bg-ios-blue-light py-2.5 text-[15px] font-semibold text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'group' ? (
              'Create'
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </Modal>
  )
}
