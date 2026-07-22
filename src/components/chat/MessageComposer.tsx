import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowUp,
  Paperclip,
  X,
  Loader2,
  ExternalLink,
  Smile,
  Mic,
  Camera,
  Trash2,
} from 'lucide-react'
import { createEmptyFolder } from '../../lib/filekiwi'
import type { Message, AttachmentInput } from '../../types/database'
import {
  storageProvider as storage,
  generateStoragePath,
  isExtensionAllowed,
  getExtension,
  MAX_FILE_SIZE,
} from '../../lib/storage'
import ReplyPreview from './ReplyPreview'
import EmojiPicker from './EmojiPicker'

interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  previewUrl?: string
}

interface MessageComposerProps {
  conversationId: string | null
  senderId: string | undefined
  sending: boolean
  replyTo: Message | null
  onCancelReply: () => void
  onSendMessage: (content: string, replyToId?: string | null) => void
  onSendWithAttachments: (
    content: string,
    attachments: AttachmentInput[],
    replyToId?: string | null
  ) => void
  onTyping: (isTyping: boolean) => void
}

async function uploadFileToStorage(file: File, conversationId: string): Promise<AttachmentInput> {
  const storagePath = generateStoragePath(conversationId, file.name)
  const ext = getExtension(file.name)
  const result = await storage.uploadFile(file, storagePath)
  return {
    storage_path: result.path,
    original_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    extension: ext,
    file_size: file.size,
  }
}

interface MessageComposerInnerProps
  extends Omit<MessageComposerProps, 'conversationId' | 'senderId'> {
  conversationId: string
  senderId: string
}

function MessageComposerInner({
  conversationId,
  sending,
  replyTo,
  onCancelReply,
  onSendMessage,
  onSendWithAttachments,
  onTyping,
}: MessageComposerInnerProps) {
  const [text, setText] = useState('')
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [kiwiLoading, setKiwiLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const dragCountRef = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const handleSendRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleSend = useCallback(async () => {
    if ((!text.trim() && uploads.length === 0) || uploading || sending) return
    setUploading(true)

    const attachmentResults: AttachmentInput[] = []

    for (const item of uploads) {
      setUploads((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading' } : u))
      )
      try {
        const uploaded = await uploadFileToStorage(item.file, conversationId)
        attachmentResults.push(uploaded)
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'done' } : u))
        )
      } catch (err) {
        console.error('File upload failed:', err)
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'error' } : u))
        )
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }, [
    text,
    uploads,
    uploading,
    sending,
    conversationId,
    replyTo,
    onSendWithAttachments,
    onSendMessage,
    onCancelReply,
  ])

  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + 'px'
    }
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000)
  }

  const handleKiwiShare = async () => {
    if (kiwiLoading) return
    setKiwiLoading(true)
    try {
      const { folderUrl } = await createEmptyFolder()
      onSendMessage(folderUrl, replyTo?.id ?? null)
      if (replyTo) onCancelReply()
    } catch (e) {
      console.error('file.kiwi error:', e)
    } finally {
      setKiwiLoading(false)
    }
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = recorder
      recordingChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        setRecording(false)
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        setRecordingDuration(0)

        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-message-${Date.now()}.webm`, {
          type: 'audio/webm',
        })
        const items: UploadItem[] = [
          { id: crypto.randomUUID(), file, status: 'pending' as const },
        ]
        setUploads((prev) => [...prev, ...items])

        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        setTimeout(() => {
          if (mountedRef.current) handleSendRef.current()
        }, 100)
      }

      recorder.start()
      setRecording(true)
      setRecordingDuration(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (e) {
      console.error('Failed to start recording:', e)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      recordingChunksRef.current = []
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    setRecordingDuration(0)
    setRecording(false)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const addFiles = (fileList: FileList | File[]) => {
    const items: UploadItem[] = Array.from(fileList)
      .filter((f) => {
        const ext = getExtension(f.name)
        if (!isExtensionAllowed(ext)) {
          console.warn(`File type .${ext} not allowed: ${f.name}`)
          return false
        }
        if (f.size > MAX_FILE_SIZE) {
          console.warn(`File too large: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`)
          return false
        }
        return true
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: 'pending' as const,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }))
    setUploads((prev) => [...prev, ...items])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }
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
    if (imageFiles.length) {
      e.preventDefault()
      addFiles(imageFiles)
    }
  }

  const isLoading = uploading || sending || kiwiLoading

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current++
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current--
    if (dragCountRef.current <= 0) {
      setIsDragging(false)
      dragCountRef.current = 0
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDropOverlay = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCountRef.current = 0
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="relative border-t border-ios-separator-light bg-ios-bg-light dark:border-ios-separator-dark dark:bg-ios-grouped-dark"
      onDragEnter={handleDragEnter}
    >
      {isDragging && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-ios-lg border-2 border-dashed border-ios-blue-light bg-ios-blue-light/12 dark:border-ios-blue-dark dark:bg-ios-blue-dark/20"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDropOverlay}
          role="presentation"
        >
          <p className="rounded-ios bg-ios-blue-light px-5 py-2 text-[14px] font-medium text-white shadow-ios dark:bg-ios-blue-dark">
            Drop files here to upload
          </p>
        </div>
      )}

      {replyTo && <ReplyPreview message={replyTo} onCancel={onCancelReply} />}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload previews */}
      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-2">
          {uploads.map((item) => (
            <div
              key={item.id}
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-ios-separator-light dark:border-ios-separator-dark"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-ios-fill-light p-1.5 text-center dark:bg-ios-fill-dark">
                  <Paperclip className="h-4 w-4 text-ios-secondary_label-light dark:text-ios-secondary_label-dark" />
                  <span className="mt-1 line-clamp-2 text-[9px] leading-tight text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
                    {item.file.name}
                  </span>
                </div>
              )}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {item.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-ios-red-light/85">
                  <span className="text-[10px] font-medium text-white">Failed</span>
                </div>
              )}
              {item.status === 'pending' && (
                <button
                  onClick={() => {
                    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
                    setUploads((prev) => prev.filter((u) => u.id !== item.id))
                  }}
                  className="ios-press absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 active:bg-black/75"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3 text-white" strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Composer row */}
      <div
        className="flex items-end gap-1.5 px-2 py-1.5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
        <button
          onClick={handleKiwiShare}
          disabled={kiwiLoading}
          className="ios-press hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light disabled:opacity-40 dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark"
          title="Share via file.kiwi (E2E encrypted)"
          aria-label="Share via file.kiwi"
        >
          {kiwiLoading ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2.2} />
          )}
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="ios-press hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark"
          title="Take photo"
          aria-label="Take photo"
        >
          <Camera className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>

        {/* Text input */}
        <div className="relative flex-1">
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                setText((prev) => prev + emoji)
                textareaRef.current?.focus()
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
          <div className="flex items-end rounded-[20px] bg-ios-fill-light pl-3 pr-1.5 dark:bg-ios-secondary-dark">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="iMessage"
              rows={1}
              aria-label="Message text"
              className="block max-h-[140px] min-h-[36px] w-full flex-1 resize-none bg-transparent px-0 py-2 text-[15px] leading-snug text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
              style={{ height: '36px' }}
            />
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`ios-press mb-1 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full active:bg-black/10 dark:active:bg-white/15 ${
                showEmojiPicker
                  ? 'bg-ios-blue-light/20 text-ios-blue-light dark:bg-ios-blue-dark/30 dark:text-ios-blue-dark'
                  : 'text-ios-secondary_label-light dark:text-ios-secondary_label-dark'
              }`}
              title="Emoji"
              aria-label="Toggle emoji picker"
            >
              <Smile className="h-[16px] w-[16px]" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Recording state */}
        {recording ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[14px] font-medium tabular-nums text-ios-red-light dark:text-ios-red-dark">
              {formatDuration(recordingDuration)}
            </span>
            <button
              onClick={cancelRecording}
              className="ios-press flex h-9 w-9 items-center justify-center rounded-full bg-ios-fill-light text-ios-label-light active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:text-white"
              title="Cancel recording"
              aria-label="Cancel recording"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button
              onClick={stopRecording}
              className="ios-press flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
              title="Send voice"
              aria-label="Send voice message"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : text.trim() || uploads.length > 0 || isLoading ? (
          <button
            onClick={handleSend}
            disabled={(!text.trim() && uploads.length === 0) || isLoading}
            className="ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark"
            title="Send"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.8} />
            )}
          </button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
            title="Hold to record"
            aria-label="Hold to record voice message"
          >
            <Mic className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function MessageComposer(props: MessageComposerProps) {
  if (!props.conversationId || !props.senderId) return null
  return (
    <MessageComposerInner
      {...props}
      conversationId={props.conversationId}
      senderId={props.senderId}
    />
  )
}
