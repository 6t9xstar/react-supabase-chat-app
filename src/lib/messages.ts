import { supabase } from './supabase'
import type { Message } from '../types/database'
import { getProfile } from './profiles'

const PAGE_SIZE = 50

export async function searchMessages(userId: string, query: string): Promise<{ conversation_id: string; content: string; created_at: string; sender_id: string }[]> {
  if (!query.trim()) return []

  const { data: convIds } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId)

  if (!convIds?.length) return []

  const ids = convIds.map((c) => c.conversation_id)

  const { data } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at, sender_id')
    .in('conversation_id', ids)
    .is('deleted_at', null)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

export async function getMessages(
  conversationId: string,
  cursor?: { created_at: string; id: string },
  limit: number = PAGE_SIZE
): Promise<{ messages: Message[]; hasMore: boolean }> {
  let query = supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id, full_name, avatar_url), reply_to:messages!reply_to_id(id, content, sender_id)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
  }

  const { data } = await query
  const hasMore = (data?.length ?? 0) > limit
  const messages = (data?.slice(0, limit).reverse() ?? []) as unknown as Message[]

  return { messages, hasMore }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  replyToId?: string | null
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      reply_to_id: replyToId ?? null,
    })
    .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
    .single()

  if (error) throw error
  return data as unknown as Message
}

export async function editMessage(messageId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ content, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', messageId)
  if (error) throw error
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
  if (error) throw error
}

export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const { data: convMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!convMessages?.length) return 0

  const { data: lastRead } = await supabase
    .from('message_reads')
    .select('read_at')
    .eq('user_id', userId)
    .eq('message_id', convMessages[0].id)
    .limit(1)

  const cursor = lastRead?.[0]?.read_at ?? '1970-01-01T00:00:00Z'

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .gt('created_at', cursor)

  return count ?? 0
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  const { data: lastMessage } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!lastMessage?.length) return

  const { error } = await supabase
    .from('message_reads')
    .upsert(
      { message_id: lastMessage[0].id, user_id: userId, read_at: new Date().toISOString() },
      { onConflict: 'message_id,user_id' }
    )
  if (error) throw error
}
