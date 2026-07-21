import { supabase } from './supabase'
import type { Profile } from '../types/database'

export async function getProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function searchProfiles(query: string, excludeUserId?: string): Promise<Profile[]> {
  let q = supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20)

  if (excludeUserId) q = q.neq('id', excludeUserId)

  const { data } = await q
  return data ?? []
}

export async function getAllActiveProfiles(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('full_name')
  return data ?? []
}


export async function updateProfile(id: string, updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'role' | 'is_active'>>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
