import type { StorageProvider } from './config'
import { supabaseStorage } from './supabase-storage'

export let storageProvider: StorageProvider = supabaseStorage

export function setStorageProvider(provider: StorageProvider) {
  storageProvider = provider
}

export { supabaseStorage } from './supabase-storage'
export * from './config'
