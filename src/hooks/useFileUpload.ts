import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { storageProvider, generateStoragePath, isExtensionAllowed, getExtension, MAX_FILE_SIZE, isImage, isVideo, isAudio } from '../lib/storage'

export interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  storagePath?: string
  signedUrl?: string
}

export function useFileUpload(conversationId: string | null, senderId: string | undefined) {
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(files)
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
        progress: 0,
        status: 'pending' as const,
      }))

    setUploads((prev) => [...prev, ...newItems])
    newItems.forEach((item) => uploadFile(item))
  }, [conversationId, senderId])

  const uploadFile = useCallback(async (item: UploadItem) => {
    if (!conversationId) return

    setUploads((prev) =>
      prev.map((u) => u.id === item.id ? { ...u, status: 'uploading' } : u)
    )

    const storagePath = generateStoragePath(conversationId, item.file.name)
    const ext = getExtension(item.file.name)

    try {
      const result = await storageProvider.uploadFile(item.file, storagePath, (pct) => {
        setUploads((prev) =>
          prev.map((u) => u.id === item.id ? { ...u, progress: pct } : u)
        )
      })

      const mimeType = item.file.type || 'application/octet-stream'

      const { data: attachment } = await supabase
        .from('attachments')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          original_name: item.file.name,
          storage_path: result.path,
          mime_type: mimeType,
          extension: ext,
          file_size: item.file.size,
        })
        .select()
        .single()

      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? { ...u, status: 'done', progress: 100, storagePath: result.path, signedUrl: result.url }
            : u
        )
      )

      return { attachment, url: result.url, path: result.path }
    } catch (err: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: 'error', error: err.message } : u
        )
      )
      return null
    }
  }, [conversationId, senderId])

  const clearUploads = useCallback(() => {
    setUploads([])
  }, [])

  return { uploads, addFiles, clearUploads }
}
