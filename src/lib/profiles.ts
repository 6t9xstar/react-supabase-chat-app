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

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .neq('id', (await supabase.auth.getUser()).data.user?.id)
    .ilike('full_name', `%${query}%`)
    .limit(20)
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
