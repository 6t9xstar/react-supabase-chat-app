import { useState, useEffect } from 'react'
import {
  addMember,
  removeMember,
  renameGroup,
  getConversationMembers,
  updateMemberRole,
} from '../../lib/conversations'
import { useProfiles } from '../../hooks/useProfiles'
import Modal from '../ui/Modal'
import Avatar from '../ui/Avatar'
import {
  Search,
  Trash2,
  Loader2,
  Shield,
  ShieldOff,
  Check,
} from 'lucide-react'

interface GroupSettingsModalProps {
  open: boolean
  onClose: () => void
  conversationId: string
  currentName: string
  userId: string
  onRename?: (newName: string) => void
}

/**
 * iOS-style group settings sheet.
 *  - Group name field
 *  - Member list with role badges and per-row actions
 *  - Search-and-add new members
 */
export default function GroupSettingsModal({
  open,
  onClose,
  conversationId,
  currentName,
  userId,
  onRename,
}: GroupSettingsModalProps) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<
    { id: string; user_id: string; role: string; full_name: string; avatar_url: string | null }[]
  >([])
  const [userRole, setUserRole] = useState<string>('member')
  const [search, setSearch] = useState('')
  const [initialized, setInitialized] = useState(false)
  const { profiles, search: searchProfiles } = useProfiles(userId)

  const isAdmin = userRole === 'admin'
  const memberIds = members.map((m) => m.user_id)

  useEffect(() => {
    if (open && !initialized) {
      setName(currentName)
      setInitialized(true)
    }
    if (!open) setInitialized(false)
  }, [open, currentName, initialized])

  useEffect(() => {
    if (open && conversationId) {
      getConversationMembers(conversationId).then((rows) => {
        setMembers(
          rows.map((m) => ({ ...m.profiles, user_id: m.user_id, role: m.role }))
        )
        const current = rows.find((m) => m.user_id === userId)
        if (current) setUserRole(current.role)
      })
    } else {
      setMembers([])
    }
  }, [open, conversationId, userId])

  const handleRename = async () => {
    if (!name.trim() || name === currentName) return
    setSaving(true)
    try {
      await renameGroup(conversationId, name.trim())
      onRename?.(name.trim())
    } catch (e) {
      console.error('Failed to rename group:', e)
      setName(currentName)
    }
    setSaving(false)
  }

  const handleAddMember = async (profileId: string) => {
    try {
      await addMember(conversationId, profileId)
      const added = profiles.find((p) => p.id === profileId)
      if (added) setMembers((prev) => [...prev, { ...added, user_id: added.id }])
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveMember = async (profileId: string) => {
    try {
      await removeMember(conversationId, profileId)
      setMembers((prev) => prev.filter((m) => m.user_id !== profileId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    searchProfiles(val)
  }

  return (
    <Modal open={open} onClose={onClose} title="Group Info" hideClose>
      <div className="space-y-4 p-4">
        {/* Rename */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
            Group name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="h-10 flex-1 rounded-[10px] bg-ios-fill-light px-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 disabled:opacity-50 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
            />
            <button
              onClick={handleRename}
              disabled={!name.trim() || name === currentName || saving || !isAdmin}
              className="ios-press flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ios-blue-light text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark"
              aria-label="Rename group"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Members */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              Members ({members.length})
            </label>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Add people"
              aria-label="Add members"
              className="h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
            />
          </div>
        </div>

        {/* Current members */}
        <div className="max-h-64 overflow-y-auto rounded-[12px] bg-ios-fill-light dark:bg-ios-secondary-dark">
          {members.map((p) => {
            const isMemberAdmin = p.role === 'admin'
            return (
              <div
                key={p.user_id}
                className="flex items-center gap-3 border-b border-ios-separator-light px-3 py-2 last:border-b-0 dark:border-ios-separator-dark"
              >
                <Avatar name={p.full_name} size="sm" src={p.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ios-label-light dark:text-ios-label-dark">
                    {p.full_name}
                    {p.user_id === userId && (
                      <span className="ml-1.5 text-[11px] font-normal text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                        (you)
                      </span>
                    )}
                  </p>
                  {isMemberAdmin && (
                    <p className="text-[11px] font-medium text-ios-orange-light dark:text-ios-orange-dark">
                      Admin
                    </p>
                  )}
                </div>
                {isAdmin && p.user_id !== userId && (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() =>
                        updateMemberRole(
                          conversationId,
                          p.user_id,
                          isMemberAdmin ? 'member' : 'admin'
                        ).then(() =>
                          setMembers((prev) =>
                            prev.map((m) =>
                              m.user_id === p.user_id
                                ? { ...m, role: isMemberAdmin ? 'member' : 'admin' }
                                : m
                            )
                          )
                        )
                      }
                      className="ios-press flex h-7 w-7 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-orange-light/15 dark:text-ios-secondary_label-dark"
                      aria-label={isMemberAdmin ? 'Remove admin' : 'Make admin'}
                      title={isMemberAdmin ? 'Remove admin' : 'Make admin'}
                    >
                      {isMemberAdmin ? (
                        <ShieldOff className="h-3.5 w-3.5" strokeWidth={2.2} />
                      ) : (
                        <Shield className="h-3.5 w-3.5" strokeWidth={2.2} />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(p.user_id)}
                      className="ios-press flex h-7 w-7 items-center justify-center rounded-full text-ios-red-light active:bg-ios-red-light/15 dark:text-ios-red-dark"
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Search results (non-members) */}
        {search.trim() && (
          <div className="overflow-hidden rounded-[12px] bg-ios-fill-light dark:bg-ios-secondary-dark">
            {profiles
              .filter((p) => !memberIds.includes(p.id) && p.id !== userId)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddMember(p.id)}
                  className="ios-press flex w-full items-center gap-3 border-b border-ios-separator-light px-3 py-2 text-left last:border-b-0 active:bg-ios-fill-light/70 dark:border-ios-separator-dark dark:active:bg-ios-secondary-dark/70"
                >
                  <Avatar name={p.full_name} size="sm" src={p.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ios-label-light dark:text-ios-label-dark">
                      {p.full_name}
                    </p>
                    <p className="truncate text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                      {p.email}
                    </p>
                  </div>
                  <span className="rounded-md bg-ios-blue-light/15 px-2 py-0.5 text-[10px] font-semibold text-ios-blue-light dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark">
                    ADD
                  </span>
                </button>
              ))}
            {profiles.filter((p) => !memberIds.includes(p.id) && p.id !== userId).length === 0 && (
              <p className="px-3 py-4 text-center text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                No matching people
              </p>
            )}
          </div>
        )}
      </div>

      <div className="ios-action-group ios-action-cancel-group">
        <button onClick={onClose} className="ios-action ios-action-cancel">
          <span>Done</span>
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </Modal>
  )
}
