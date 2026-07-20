export type Role = 'admin' | 'employee'

export interface Profile {
  id: string
  email: string | null
  full_name: string
  avatar_url: string | null
  role: Role
  is_active: boolean
  created_at: string
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
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  reply_to_id: string | null
  is_edited: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  sender?: Profile
  reply_to?: Message
  attachments?: Attachment[]
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

export interface ConversationWithMeta extends Conversation {
  members?: ConversationMember[]
  last_message?: Message | null
  unread_count?: number
  other_user?: Profile | null
}
