import type { StorageProvider, StorageResult } from './config'
import { supabase } from '../supabase'

const BUCKET = 'attachments'
const SIGNED_URL_EXPIRY = 3600 // 1 hour

export const supabaseStorage: StorageProvider = {
  async uploadFile(file: File, path: string, onProgress?: (pct: number) => void): Promise<StorageResult> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        cacheControl: '3600',
      })

    if (error) throw error

    if (onProgress) onProgress(100)

    const { data: urlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY)

    return {
      path: data.path,
      url: urlData?.signedUrl ?? '',
    }
  },

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path])

    if (error) throw error
  },

  async getDownloadUrl(path: string): Promise<string> {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY)

    return data?.signedUrl ?? ''
  },

  async getPreviewUrl(path: string): Promise<string> {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY)

    return data?.signedUrl ?? ''
  },
}
