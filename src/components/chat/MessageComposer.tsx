import { useState, useRef } from 'react'
import { Send, Paperclip, X, Loader2 } from 'lucide-react'
import type { Message } from '../../types/database'
import { supabase } from '../../lib/supabase'
import { storageProvider as storage, generateStoragePath, isExtensionAllowed, getExtension, formatFileSize } from '../../lib/storage'
import ReplyPreview from './ReplyPreview'

interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
}

interface MessageComposerProps {
  conversationId: string | null
  senderId: string | undefined
  sending: boolean
  replyTo: Message | null
  onCancelReply: () => void
  onSendMessage: (content: string, replyToId?: string | null) => void
  onSendWithAttachments: (content: string, attachments: { storage_path: string; original_name: string; mime_type: string; extension: string; file_size: number }[], replyToId?: string | null) => void
  onTyping: (isTyping: boolean) => void
}

async function uploadFile(file: File, conversationId: string, senderId: string) {
  const storagePath = generateStoragePath(conversationId, file.name)
  const ext = getExtension(file.name)
  const result = await storage.uploadFile(file, storagePath)
  const { data: attachment } = await supabase.from('attachments').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    original_name: file.name,
    storage_path: result.path,
    mime_type: file.type || 'application/octet-stream',
    extension: ext,
    file_size: file.size,
  }).select().single()
  return { attachment, path: result.path, ext }
}

export default function MessageComposer({
  conversationId, senderId, sending, replyTo, onCancelReply,
  onSendMessage, onSendWithAttachments, onTyping
}: MessageComposerProps) {
  const [text, setText] = useState('')
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!conversationId || !senderId) return null

  const addFiles = (files: FileList | File[]) => {
    const items: UploadItem[] = Array.from(files)
      .filter((f) => isExtensionAllowed(getExtension(f.name)))
      .map((file) => ({ id: crypto.randomUUID(), file, status: 'pending' as const }))
    setUploads((prev) => [...prev, ...items])
  }

  const handleSend = async () => {
    if ((!text.trim() && uploads.length === 0) || uploading || sending) return
    setUploading(true)

    const attachmentResults: { storage_path: string; original_name: string; mime_type: string; extension: string; file_size: number }[] = []

    for (const item of uploads) {
      setUploads((prev) => prev.map((u) => u.id === item.id ? { ...u, status: 'uploading' } : u))
      try {
        const { attachment } = await uploadFile(item.file, conversationId, senderId)
        attachmentResults.push({
          storage_path: attachment.storage_path,
          original_name: attachment.original_name,
          mime_type: attachment.mime_type,
          extension: attachment.extension,
          file_size: attachment.file_size,
        })
      } catch {
        setUploads((prev) => prev.map((u) => u.id === item.id ? { ...u, status: 'error' } : u))
      }
    }

    const content = text.trim()
    const replyToId = replyTo?.id ?? null

    if (attachmentResults.length > 0) {
      onSendWithAttachments(content, attachmentResults, replyToId)
    } else if (content) {
      onSendMessage(content, replyToId)
    }

    if (replyTo && (content || attachmentResults.length > 0)) {
      onCancelReply()
    }

    setText('')
    setUploads([])
    setUploading(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files) }
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length) { e.preventDefault(); addFiles(imageFiles as unknown as FileList) }
  }

  const isLoading = uploading || sending

  return (
    <div class="border-t border-gray-200 bg-white">
      {replyTo && <ReplyPreview message={replyTo} onCancel={onCancelReply} />}

      <input ref={fileInputRef} type="file" multiple class="hidden" onChange={handleFileSelect} />

      {uploads.length > 0 && (
        <div class="flex flex-wrap gap-2 border-t border-gray-100 px-6 py-2">
          {uploads.map((item) => (
            <div key={item.id} class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
              <span class="max-w-[100px] truncate text-gray-700">{item.file.name}</span>
              {item.status === 'uploading' && <Loader2 class="h-3 w-3 animate-spin text-brand-500" />}
              {item.status === 'error' && <span class="text-red-500">Failed</span>}
              {item.status === 'pending' && (
                <button onClick={() => setUploads((prev) => prev.filter((u) => u.id !== item.id))} class="text-gray-400 hover:text-red-500">
                  <X class="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div class="flex items-end gap-3 px-6 py-4" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <button
          onClick={() => fileInputRef.current?.click()}
          class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Attach file"
        >
          <Paperclip class="h-5 w-5" />
        </button>
        <div class="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            class="block w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!text.trim() && uploads.length === 0) || isLoading}
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-400 disabled:opacity-50"
          title="Send"
        >
          {isLoading ? <Loader2 class="h-4 w-4 animate-spin" /> : <Send class="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
