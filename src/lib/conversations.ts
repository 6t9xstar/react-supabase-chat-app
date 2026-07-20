import { supabase } from './supabase'
import type { Conversation, ConversationWithMeta } from '../types/database'

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

  const results: ConversationWithMeta[] = []

  for (const conv of conversations) {
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at, deleted_at')
      .eq('conversation_id', conv.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    const { count: unreadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .gt('created_at', (await getLastReadAt(conv.id, userId)) ?? '1970-01-01')

    let otherUser = null
    if (conv.type === 'direct') {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conv.id)
        .neq('user_id', userId)
        .limit(1)

      if (members?.length) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', members[0].user_id)
          .single()
        otherUser = profile
      }
    }

    results.push({
      ...conv,
      last_message: lastMessage?.[0] ?? null,
      unread_count: unreadCount ?? 0,
      other_user: otherUser,
    })
  }

  return results
}

async function getLastReadAt(conversationId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('message_reads')
    .select('read_at')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(1)

  return data?.[0]?.read_at ?? null
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

export async function getConversationMembers(conversationId: string) {
  const { data } = await supabase
    .from('conversation_members')
    .select('user_id, profiles!inner(id, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
  return data ?? []
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
