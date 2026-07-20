import { useState, useRef, useEffect } from 'react'
import type { Message, Attachment } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { formatDistanceToNow } from '../../lib/formatDate'
import { isImage, isVideo, isAudio } from '../../lib/storage/config'
import { editMessage, deleteMessage } from '../../lib/messages'
import FileCard from '../messages/FileCard'
import ImagePreview from '../messages/ImagePreview'
import VideoPlayer from '../messages/VideoPlayer'
import AudioPlayer from '../messages/AudioPlayer'
import { Reply, Pencil, Trash2, Check, X } from 'lucide-react'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onReply: (message: Message) => void
}

export default function MessageItem({ message, isOwn, onReply }: MessageItemProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map())
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content ?? '')
  const [savingEdit, setSavingEdit] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!message.id) return
    supabase
      .from('attachments')
      .select('*')
      .eq('message_id', message.id)
      .then(async ({ data }) => {
        if (!data?.length) return
        setAttachments(data)
        const urlMap = new Map<string, string>()
        for (const att of data) {
          const { data: urlData } = await supabase.storage
            .from('attachments')
            .createSignedUrl(att.storage_path, 3600)
          if (urlData) urlMap.set(att.storage_path, urlData.signedUrl)
        }
        setSignedUrls(urlMap)
      })
  }, [message.id])

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editText.length, editText.length)
    }
  }, [editing])

  // Reply message lookup
  const [replyMsg, setReplyMsg] = useState<Message | null>(null)
  useEffect(() => {
    if (!message.reply_to_id) return
    supabase.from('messages').select('id, content, sender_id, deleted_at').eq('id', message.reply_to_id).single()
      .then(({ data }) => setReplyMsg(data as Message | null))
  }, [message.reply_to_id])

  const handleSaveEdit = async () => {
    if (!editText.trim() || !message.id) return
    setSavingEdit(true)
    try {
      await editMessage(message.id, editText.trim())
      setEditing(false)
    } catch {
      // revert
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditText(message.content ?? '')
  }

  if (message.deleted_at) {
    return (
      <div class={`flex ${isOwn ? 'justify-end' : 'justify-start'} py-1`}>
        <p class="rounded-lg bg-gray-100 px-4 py-2 text-xs italic text-gray-400">
          This message was deleted
        </p>
      </div>
    )
  }

  return (
    <div class={`group flex ${isOwn ? 'justify-end' : 'justify-start'} py-1`}>
      <div class={`max-w-[70%] space-y-2 rounded-2xl px-4 py-2 ${
        isOwn ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        {/* Context menu (own messages only) */}
        {isOwn && !editing && (
          <div class={`hidden group-hover:flex absolute -top-2 ${isOwn ? 'right-0' : 'left-0'} gap-1`}>
            <button
              onClick={() => onReply(message)}
              class="rounded-lg bg-white p-1.5 text-gray-500 shadow-sm hover:text-brand-500 hover:shadow"
              title="Reply"
            >
              <Reply class="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setEditing(true); setEditText(message.content ?? '') }}
              class="rounded-lg bg-white p-1.5 text-gray-500 shadow-sm hover:text-blue-500 hover:shadow"
              title="Edit"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
            <button
              onClick={async () => {
                if (confirm('Delete this message?')) {
                  await deleteMessage(message.id)
                }
              }}
              class="rounded-lg bg-white p-1.5 text-gray-500 shadow-sm hover:text-red-500 hover:shadow"
              title="Delete"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Reply indicator */}
        {!editing && message.reply_to_id && replyMsg && (
          <div class={`flex items-center gap-2 rounded-lg p-2 text-xs ${
            isOwn ? 'bg-brand-600' : 'bg-gray-200'
          }`}>
            <Reply class="h-3 w-3 shrink-0" />
            <p class={`truncate ${isOwn ? 'text-brand-100' : 'text-gray-500'}`}>
              {replyMsg?.deleted_at ? 'Message deleted' : replyMsg?.content || ''}
            </p>
          </div>
        )}

        {/* Reply button for non-own messages */}
        {!isOwn && !editing && (
          <div class="hidden group-hover:flex absolute -top-2 left-0 gap-1">
            <button
              onClick={() => onReply(message)}
              class="rounded-lg bg-white p-1.5 text-gray-500 shadow-sm hover:text-brand-500 hover:shadow"
              title="Reply"
            >
              <Reply class="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Text content / Edit mode */}
        {editing ? (
          <div class="space-y-2">
            <textarea
              ref={editRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              rows={3}
            />
            <div class="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                class="rounded-lg bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300"
              >
                <X class="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editText.trim() || savingEdit}
                class="rounded-lg bg-brand-500 p-1.5 text-white hover:bg-brand-400 disabled:opacity-50"
              >
                <Check class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          message.content && (
            <p class="text-sm whitespace-pre-wrap break-words">
              {message.content}
              {message.is_edited && (
                <span class={`ml-1 text-xs ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>
                  (edited)
                </span>
              )}
            </p>
          )
        )}

        {/* Attachments */}
        {!editing && attachments.map((att) => {
          const url = signedUrls.get(att.storage_path)
          if (!url) return null
          const ext = att.extension.toLowerCase()
          if (isImage(ext)) return <ImagePreview key={att.id} src={url} alt={att.original_name} />
          if (isVideo(ext)) return <VideoPlayer key={att.id} src={url} name={att.original_name} />
          if (isAudio(ext)) return <AudioPlayer key={att.id} src={url} name={att.original_name} />
          return <FileCard key={att.id} name={att.original_name} size={att.file_size} extension={ext} url={url} />
        })}

        {/* Metadata */}
        {!editing && (
          <p class={`text-right text-xs ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>
            {formatDistanceToNow(message.created_at)}
            {message.status === 'sending' && ' · sending...'}
            {message.status === 'failed' && ' · failed to send'}
          </p>
        )}
      </div>
    </div>
  )
}
