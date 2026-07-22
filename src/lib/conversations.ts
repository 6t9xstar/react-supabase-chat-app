import { supabase } from './supabase'
import type { ConversationWithMeta } from '../types/database'

async function findExistingDirectConversation(userA: string, userB: string): Promise<string | null> {
  const { data: aConvs } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userA)

  if (!aConvs?.length) return null

  const aIds = aConvs.map((c) => c.conversation_id)

  const { data: directConvs } = await supabase
    .from('conversations')
    .select('id')
    .in('id', aIds)
    .eq('type', 'direct')

  if (!directConvs?.length) return null

  const directIds = directConvs.map((c) => c.id)

  const { data: shared } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .in('conversation_id', directIds)
    .eq('user_id', userB)
    .limit(1)

  return shared?.[0]?.conversation_id ?? null
}

export async function getConversations(userId: string): Promise<ConversationWithMeta[]> {
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId)

  if (!memberships?.length) return []

  const ids = memberships.map((m) => m.conversation_id)

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .in('id', ids)
    .order('updated_at', { ascending: false })

  if (!conversations) return []

  const [lastMsgMap, otherUserMap, unreadMap] = await Promise.all([
    getLastMessagesMap(ids),
    getOtherUsersMap(ids, userId),
    getUnreadCountsMap(userId),
  ])

  return conversations.map((conv) => ({
    ...conv,
    last_message: lastMsgMap.get(conv.id) ?? null,
    unread_count: unreadMap.get(conv.id) ?? 0,
    other_user: conv.type === 'direct' ? otherUserMap.get(conv.id) ?? null : null,
  }))
}

async function getUnreadCountsMap(userId: string): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase.rpc('get_unread_counts', { p_user_id: userId })
    if (error) throw error
    return new Map((data ?? []).map((r: { conversation_id: string; unread_count: number }) => [r.conversation_id, r.unread_count]))
  } catch (e) {
    console.error('get_unread_counts failed:', e)
    return new Map()
  }
}

async function getLastMessagesMap(convIds: string[]): Promise<Map<string, { id: string; content: string | null; sender_id: string; created_at: string; deleted_at: string | null }>> {
  const map = new Map()
  if (!convIds.length) return map

  const { data, error } = await supabase.rpc('get_last_messages', {
    p_conversation_ids: convIds,
  })
  if (error) {
    console.error('get_last_messages failed:', error)
    return map
  }

  for (const msg of data ?? []) {
    map.set(msg.conversation_id, msg)
  }
  return map
}

async function getOtherUsersMap(convIds: string[], userId: string): Promise<Map<string, { id: string; full_name: string; avatar_url: string | null }>> {
  const map = new Map()
  const { data: members } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds)
    .neq('user_id', userId)

  if (!members?.length) return map

  const otherUserIds = [...new Set(members.map(m => m.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', otherUserIds)

  if (profiles) {
    const profileMap = new Map(profiles.map(p => [p.id, p]))
    for (const m of members) {
      const profile = profileMap.get(m.user_id)
      if (profile) map.set(m.conversation_id, profile)
    }
  }
  return map
}

export async function findOrCreateDirectConversation(userA: string, userB: string): Promise<string> {
  const existing = await findExistingDirectConversation(userA, userB)
  if (existing) return existing

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: userA })
    .select()
    .single()

  if (error || !conv) throw error ?? new Error('Failed to create conversation')

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: userA },
    { conversation_id: conv.id, user_id: userB },
  ])

  return conv.id
}

export async function createGroupConversation(name: string, createdBy: string, memberIds: string[]): Promise<string> {
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type: 'group', name, created_by: createdBy })
    .select()
    .single()

  if (error || !conv) throw error ?? new Error('Failed to create group')

  const allMembers = [...new Set([createdBy, ...memberIds])]
  await supabase.from('conversation_members').insert(
    allMembers.map((userId) => ({ conversation_id: conv.id, user_id: userId }))
  )

  return conv.id
}

export async function getConversationMembers(conversationId: string): Promise<{ user_id: string; role: string; profiles: { id: string; full_name: string; avatar_url: string | null } }[]> {
  const { data } = await supabase
    .from('conversation_members')
    .select('user_id, role, profiles!inner(id, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
  return (data ?? []) as any
}

export async function updateMemberRole(conversationId: string, userId: string, role: 'member' | 'admin') {
  const { error } = await supabase
    .from('conversation_members')
    .update({ role })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function addMember(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('conversation_members')
    .insert({ conversation_id: conversationId, user_id: userId })
  if (error) throw error
}

export async function removeMember(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('conversation_members')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function renameGroup(conversationId: string, name: string) {
  const { error } = await supabase
    .from('conversations')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
  if (error) throw error
}
