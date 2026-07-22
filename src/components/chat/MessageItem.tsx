import { useState, useRef, useEffect, useMemo } from 'react'
import type { Message, Attachment, Reaction as ReactionType } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { formatTimeShort, isToday, formatTime } from '../../lib/formatDate'
import { isImage, isVideo, isAudio } from '../../lib/storage/config'
import {
  editMessage,
  deleteMessage,
  toggleReaction,
  pinMessage,
  unpinMessage,
} from '../../lib/messages'
import FileCard from '../messages/FileCard'
import ImagePreview from '../messages/ImagePreview'
import VideoPlayer from '../messages/VideoPlayer'
import AudioPlayer from '../messages/AudioPlayer'
import {
  Reply,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  X,
  Pin,
  PinOff,
  Forward,
  AlertCircle,
  Timer,
} from 'lucide-react'
import FileKiwiCard from '../messages/FileKiwiCard'
import { extractKiwiUrl } from '../../lib/filekiwi'
import RichText from '../../utils/richText'
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal'

const QUICK_EMOJIS = ['❤️', '👍', '😂', '‼️', '❓']

interface MessageItemProps {
  message: Message
  isOwn: boolean
  isGroup: boolean
  showSender: boolean
  currentUserId: string
  onReply: (message: Message) => void
  onForward: (message: Message) => void
  onRetry?: (message: Message) => void
  /** Grouped with the previous message (no name + no gap) */
  groupedPrev?: boolean
  /** Grouped with the next message (no bottom gap, asymmetric corner) */
  groupedNext?: boolean
  /** Last in conversation group (for the meta line spacing) */
  isLastInGroup?: boolean
  onJumpToMessage?: (id: string) => void
}

export default function MessageItem({
  message,
  isOwn,
  isGroup,
  showSender,
  currentUserId,
  onReply,
  onForward,
  onRetry,
  groupedPrev,
  groupedNext,
  isLastInGroup = true,
  onJumpToMessage,
}: MessageItemProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map())
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content ?? '')
  const [savingEdit, setSavingEdit] = useState(false)
  const [reactions, setReactions] = useState(message.reactions ?? [])
  const [_readReceipts] = useState(message.read_receipts ?? [])
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletedLocally, setDeletedLocally] = useState(false)
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!message.id) return
    let cancelled = false

    supabase
      .from('attachments')
      .select('*')
      .eq('message_id', message.id)
      .then(async ({ data }) => {
        if (!data?.length || cancelled) return
        setAttachments(data)
        const paths = data.map((att) => att.storage_path)
        const { data: signedData } = await supabase.storage
          .from('attachments')
          .createSignedUrls(paths, 3600)
        if (cancelled) return
        const urlMap = new Map<string, string>()
        for (const row of signedData ?? []) {
          if (row.signedUrl && row.path) urlMap.set(row.path, row.signedUrl as string)
        }
        setSignedUrls(urlMap)
      })

    supabase
      .from('pinned_messages')
      .select('id')
      .eq('message_id', message.id)
      .limit(1)
      .then(({ data }) => {
        if (data?.length && !cancelled) setPinnedId(data[0].id)
      })

    return () => {
      cancelled = true
    }
  }, [message.id])

  // Refresh signed URLs before they expire
  useEffect(() => {
    if (!attachments.length) return
    const refresh = async () => {
      const paths = attachments.map((att) => att.storage_path)
      const { data } = await supabase.storage
        .from('attachments')
        .createSignedUrls(paths, 3600)
      if (!data) return
      const urlMap = new Map<string, string>()
      for (const row of data) if (row.signedUrl && row.path) urlMap.set(row.path, row.signedUrl as string)
      setSignedUrls(urlMap)
    }
    const interval = setInterval(refresh, 50 * 60 * 1000)
    return () => clearInterval(interval)
  }, [attachments])

  const replyMsg = message.reply_to ?? null

  const handleSaveEdit = async () => {
    if (!editText.trim() || !message.id) return
    setSavingEdit(true)
    try {
      await editMessage(message.id, editText.trim())
      setEditing(false)
    } catch (e) {
      console.error('Failed to edit message:', e)
      setEditText(message.content ?? '')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditText(message.content ?? '')
  }

  const handleReaction = async (emoji: string) => {
    setReactionPickerOpen(false)
    setContextMenu(null)
    try {
      const added = await toggleReaction(message.id, currentUserId, emoji)
      if (added) {
        setReactions((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            message_id: message.id,
            user_id: currentUserId,
            emoji,
            created_at: new Date().toISOString(),
            profile: { id: currentUserId, full_name: 'You' },
          },
        ])
      } else {
        setReactions((prev) =>
          prev.filter((r) => !(r.emoji === emoji && r.user_id === currentUserId))
        )
      }
    } catch (e) {
      console.error('Failed to toggle reaction:', e)
    }
  }

  const handlePin = async () => {
    setContextMenu(null)
    if (!message.id || !message.conversation_id) return
    try {
      if (pinnedId) {
        await unpinMessage(pinnedId)
        setPinnedId(null)
      } else {
        await pinMessage(message.conversation_id, message.id, currentUserId)
        setPinnedId('pending')
        const { data } = await supabase
          .from('pinned_messages')
          .select('id')
          .eq('message_id', message.id)
          .single()
        if (data) setPinnedId(data.id)
      }
    } catch (e) {
      console.error('Failed to toggle pin:', e)
    }
  }

  const handleContextAction = (action: () => void) => {
    setContextMenu(null)
    setReactionPickerOpen(false)
    action()
  }

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setReactionPickerOpen(true)
    }, 500)
  }
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const emojiGroups = useMemo(() => {
    return reactions.reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false }
      acc[r.emoji].count++
      if ((r as ReactionType).user_id === currentUserId) acc[r.emoji].mine = true
      return acc
    }, {} as Record<string, { count: number; mine: boolean }>)
  }, [reactions, currentUserId])

  const seenBy = _readReceipts
    .filter((r) => r.profile?.full_name)
    .slice(0, 3)
    .map((r) => r.profile!.full_name)

  if (message.deleted_at || deletedLocally) {
    return (
      <div
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${groupedNext ? '' : 'pb-1'} ${groupedPrev ? 'pt-0.5' : 'pt-2'} px-3`}
      >
        <div
          className={`rounded-[16px] bg-ios-bubble-light px-3 py-1.5 text-[13px] italic text-ios-secondary_label-light dark:bg-ios-bubble-dark dark:text-ios-secondary_label-dark ${
            isOwn ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'
          }`}
        >
          This message was deleted
        </div>
      </div>
    )
  }

  const bubbleClass = [
    'ios-bubble',
    isOwn ? 'ios-bubble-own' : 'ios-bubble-other',
    groupedPrev && (isOwn ? 'ios-bubble-grouped-prev' : 'ios-bubble-grouped-prev'),
    groupedNext && (isOwn ? 'ios-bubble-grouped-next' : 'ios-bubble-grouped-next'),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={`group relative flex ${isOwn ? 'justify-end' : 'justify-start'} ${
        groupedNext ? '' : 'pb-1'
      } ${groupedPrev ? 'pt-0.5' : 'pt-2'} px-3`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <div className="flex max-w-[78%] flex-col" style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {/* Sender name (group chat only) */}
        {!isOwn && isGroup && showSender && !editing && (
          <button
            onClick={() => onJumpToMessage?.(message.id)}
            className="ios-press mb-0.5 ml-3 text-[12px] font-medium text-ios-secondary_label-light active:opacity-60 dark:text-ios-secondary_label-dark"
          >
            {message.sender?.full_name ?? 'Unknown'}
          </button>
        )}

        <div className={bubbleClass}>
          {/* Pinned indicator */}
          {pinnedId && (
            <div
              className={`mb-1 flex items-center gap-1 text-[11px] ${
                isOwn
                  ? 'text-white/85'
                  : 'text-ios-secondary_label-light dark:text-ios-secondary_label-dark'
              }`}
            >
              <Pin className="h-3 w-3" strokeWidth={2.5} />
              <span className="font-medium">Pinned</span>
            </div>
          )}

          {/* Forwarded banner */}
          {message.forwarded_from && !message.forwarded_from.deleted_at && (
            <div
              className={`mb-1 flex items-center gap-1 text-[11px] ${
                isOwn
                  ? 'text-white/85'
                  : 'text-ios-secondary_label-light dark:text-ios-secondary_label-dark'
              }`}
            >
              <Forward className="h-3 w-3" strokeWidth={2.5} />
              <span className="font-medium">
                Forwarded from {message.forwarded_from.sender?.full_name ?? 'Unknown'}
              </span>
            </div>
          )}

          {/* Reply preview */}
          {!editing && message.reply_to_id && replyMsg && (
            <button
              onClick={() => onJumpToMessage?.(message.reply_to_id!)}
              className={`mb-1.5 flex w-full max-w-full items-center gap-2 rounded-[12px] px-2.5 py-1.5 text-left text-[13px] ${
                isOwn
                  ? 'bg-white/15 text-white'
                  : 'bg-black/5 text-ios-label-light dark:bg-white/8 dark:text-ios-label-dark'
              }`}
            >
              <span
                className={`h-7 w-0.5 shrink-0 rounded-full ${
                  isOwn ? 'bg-white/60' : 'bg-ios-blue-light dark:bg-ios-blue-dark'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[12px] font-semibold ${
                    isOwn ? 'text-white/85' : 'text-ios-blue-light dark:text-ios-blue-dark'
                  }`}
                >
                  {replyMsg?.sender?.full_name ?? (replyMsg?.sender_id === currentUserId ? 'You' : 'Unknown')}
                </p>
                <p
                  className={`truncate ${
                    isOwn ? 'text-white/75' : 'text-ios-secondary_label-light dark:text-ios-secondary_label-dark'
                  }`}
                >
                  {replyMsg?.deleted_at
                    ? 'Message deleted'
                    : replyMsg?.content || (replyMsg?.attachments?.length ? '📎 Attachment' : '…')}
                </p>
              </div>
            </button>
          )}

          {/* Text content / Edit mode */}
          {editing ? (
            <div className="space-y-1.5">
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={`w-full resize-none rounded-[10px] bg-white px-2.5 py-1.5 text-[15px] text-ios-label-light focus:outline-none dark:bg-black dark:text-ios-label-dark`}
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={handleCancelEdit}
                  aria-label="Cancel edit"
                  className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-ios-label-light active:bg-black/20 dark:bg-white/15 dark:text-white"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || savingEdit}
                  aria-label="Save edit"
                  className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          ) : message.content ? (
            (() => {
              const kiwi = extractKiwiUrl(message.content)
              if (kiwi) {
                return <FileKiwiCard folderUrl={kiwi.folderUrl} folderId={kiwi.folderId} />
              }
              return (
                <div className="text-[15px] leading-[1.35] tracking-[-0.2px]">
                  <RichText text={message.content} />
                  {message.is_edited && <span className="ios-bubble-edited">edited</span>}
                </div>
              )
            })()
          ) : null}

          {/* Attachments */}
          {!editing &&
            attachments.map((att) => {
              const url = signedUrls.get(att.storage_path)
              if (!url) return null
              const ext = att.extension.toLowerCase()
              if (isImage(ext)) {
                return (
                  <div className="ios-bubble-attachment mt-1 first:mt-0" key={att.id}>
                    <ImagePreview src={url} alt={att.original_name} />
                  </div>
                )
              }
              if (isVideo(ext)) {
                return (
                  <div className="ios-bubble-attachment mt-1 first:mt-0" key={att.id}>
                    <VideoPlayer src={url} name={att.original_name} />
                  </div>
                )
              }
              if (isAudio(ext)) {
                return (
                  <div className="mt-1 first:mt-0" key={att.id}>
                    <AudioPlayer src={url} name={att.original_name} />
                  </div>
                )
              }
              return (
                <div className="mt-1 first:mt-0" key={att.id}>
                  <FileCard name={att.original_name} size={att.file_size} extension={ext} url={url} />
                </div>
              )
            })}

          {/* Meta line: timestamp + read receipt */}
          {!editing && (
            <div className="ios-bubble-meta">
              {message.expires_at && (
                <Timer className="h-3 w-3 opacity-80" strokeWidth={2.5} />
              )}
              <span>{formatTimeShort(message.created_at)}</span>
              {isOwn && seenBy.length > 0 ? (
                <span
                  title={`Seen by ${seenBy.join(', ')}${
                    _readReceipts.length > 3 ? ` +${_readReceipts.length - 3}` : ''
                  }`}
                  aria-label={`Seen by ${seenBy.join(', ')}`}
                >
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              ) : isOwn && message.status === 'sending' ? (
                <span
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
                  aria-label="Sending"
                />
              ) : isOwn && message.status === 'failed' ? (
                <button
                  onClick={() => onRetry?.(message)}
                  title="Tap to retry"
                  aria-label="Retry sending message"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-ios-red-light dark:text-ios-red-dark" strokeWidth={2.5} />
                </button>
              ) : isOwn && message.status === 'sent' ? (
                <Check className="h-3.5 w-3.5 opacity-80" strokeWidth={2.5} />
              ) : null}
            </div>
          )}
        </div>

        {/* Reaction chips below bubble */}
        {!editing && Object.keys(emojiGroups).length > 0 && (
          <div
            className={`mt-0.5 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            {Object.entries(emojiGroups).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`ios-reaction ${mine ? 'is-mine' : ''}`}
              >
                <span className="text-[13px]">{emoji}</span>
                {count > 1 && <span className="text-[11px]">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: hover toolbar */}
      <div
        className={`pointer-events-none absolute -top-3 z-10 hidden gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 md:flex ${
          isOwn ? 'right-3' : 'left-3'
        }`}
      >
        <button
          onClick={() => onReply(message)}
          className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-secondary_label-light shadow-ios active:bg-ios-fill-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark"
          title="Reply"
          aria-label="Reply"
        >
          <Reply className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
        {isOwn && (
          <button
            onClick={() => setEditing(true)}
            className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-secondary_label-light shadow-ios active:bg-ios-fill-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark"
            title="Edit"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        )}
        <button
          onClick={() => onForward(message)}
          className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-secondary_label-light shadow-ios active:bg-ios-fill-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark"
          title="Forward"
          aria-label="Forward"
        >
          <Forward className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
        <button
          onClick={handlePin}
          className={`ios-press flex h-7 w-7 items-center justify-center rounded-full shadow-ios active:bg-ios-fill-light dark:active:bg-ios-fill-dark ${
            pinnedId
              ? 'bg-ios-blue-light text-white dark:bg-ios-blue-dark'
              : 'bg-ios-bg-light text-ios-secondary_label-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark'
          }`}
          title={pinnedId ? 'Unpin' : 'Pin'}
          aria-label={pinnedId ? 'Unpin' : 'Pin'}
        >
          {pinnedId ? (
            <PinOff className="h-3.5 w-3.5" strokeWidth={2.2} />
          ) : (
            <Pin className="h-3.5 w-3.5" strokeWidth={2.2} />
          )}
        </button>
        {isOwn && (
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-red-light shadow-ios active:bg-ios-red-light/10 dark:bg-ios-secondary-dark dark:text-ios-red-dark"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Mobile: long-press reaction picker */}
      {reactionPickerOpen && (
        <div
          className="absolute -top-12 left-1/2 z-30 -translate-x-1/2 animate-ios-pop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="ios-reaction-popover">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Right-click / long-press full context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            aria-hidden
          />
          <div
            className="ios-action-group fixed z-50 w-56 animate-ios-pop !m-0"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 240),
              top: Math.min(contextMenu.y, window.innerHeight - 280),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-around bg-ios-bg-light px-2 py-1.5 dark:bg-ios-secondary-dark">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[20px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="ios-hairline" />
            <button onClick={() => handleContextAction(() => onReply(message))} className="ios-action">
              <Reply className="h-[18px] w-[18px]" /> Reply
            </button>
            {isOwn && (
              <button onClick={() => handleContextAction(() => setEditing(true))} className="ios-action">
                <Pencil className="h-[18px] w-[18px]" /> Edit
              </button>
            )}
            <button onClick={() => handleContextAction(() => onForward(message))} className="ios-action">
              <Forward className="h-[18px] w-[18px]" /> Forward
            </button>
            <button onClick={handlePin} className="ios-action">
              {pinnedId ? <PinOff className="h-[18px] w-[18px]" /> : <Pin className="h-[18px] w-[18px]" />}
              {pinnedId ? 'Unpin' : 'Pin'}
            </button>
            {isOwn && (
              <button
                onClick={() => handleContextAction(() => setDeleteConfirmOpen(true))}
                className="ios-action ios-action-destructive"
              >
                <Trash2 className="h-[18px] w-[18px]" /> Delete
              </button>
            )}
          </div>
        </>
      )}

      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onDeleteForMe={() => {
          setDeletedLocally(true)
          setDeleteConfirmOpen(false)
        }}
        onDeleteForEveryone={
          message.sender_id === currentUserId
            ? () => {
                deleteMessage(message.id)
                setDeleteConfirmOpen(false)
              }
            : undefined
        }
      />
    </div>
  )
}

// re-export helper for MessageList grouping
export { isToday, formatTime }
