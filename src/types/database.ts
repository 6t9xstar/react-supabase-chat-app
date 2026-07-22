export type Role = 'admin' | 'employee'

/** Subset of Profile used in lists, headers, and search results */
export interface ProfileSummary {
  id: string
  full_name: string
  avatar_url: string | null
  last_seen_at?: string | null
}

export interface ProfileSearchResult {
  id: string
  email: string | null
  full_name: string
  avatar_url: string | null
  role: Role
}

export interface AttachmentInput {
  storage_path: string
  original_name: string
  mime_type: string
  extension: string
  file_size: number
}

export interface ConversationMemberWithProfile {
  user_id: string
  role: string
  profiles: { id: string; full_name: string; avatar_url: string | null }
}

export interface Profile {
  id: string
  email: string | null
  full_name: string
  avatar_url: string | null
  role: Role
  is_active: boolean
  created_at: string
  last_seen_at?: string | null
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  name: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ConversationMember {
  id: string
  conversation_id: string
  user_id: string
  role: 'member' | 'admin'
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  reply_to_id: string | null
  forwarded_from_id: string | null
  is_edited: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  expires_at?: string | null
  sender?: Profile
  reply_to?: Message
  forwarded_from?: Message
  attachments?: Attachment[]
  reactions?: Reaction[]
  read_receipts?: ReadReceipt[]
  status?: 'sending' | 'sent' | 'failed'
}

export interface Attachment {
  id: string
  message_id: string
  conversation_id: string
  sender_id: string
  original_name: string
  storage_path: string
  mime_type: string
  extension: string
  file_size: number
  created_at: string
}

export interface MessageRead {
  message_id: string
  user_id: string
  read_at: string
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  profile?: Pick<Profile, 'id' | 'full_name'>
}

export interface PinnedMessage {
  id: string
  conversation_id: string
  message_id: string
  pinned_by: string
  created_at: string
  message?: Message
  pinner?: Profile
}

export interface ReadReceipt {
  id: string
  message_id: string
  user_id: string
  read_at: string
  profile?: Profile
}

export interface ConversationWithMeta extends Conversation {
  members?: ConversationMember[]
  last_message?: Message | null
  unread_count?: number
  other_user?: Profile | null
}
