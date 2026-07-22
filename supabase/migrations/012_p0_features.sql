-- P0 features: reactions, pinned messages, read receipts, message forwarding

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Pinned messages
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Read receipts (per-message)
CREATE TABLE IF NOT EXISTS read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Forward column on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conv ON pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON read_receipts(message_id);

-- RLS policies
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;

-- Reactions: authenticated users can read all, insert their own
CREATE POLICY reactions_select ON reactions FOR SELECT USING (true);
CREATE POLICY reactions_insert ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY reactions_delete ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Pinned messages: conversation members can read; admins can insert/delete
CREATE POLICY pinned_messages_select ON pinned_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = pinned_messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY pinned_messages_insert ON pinned_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY pinned_messages_delete ON pinned_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Read receipts: conversation members can read/insert
CREATE POLICY read_receipts_select ON read_receipts FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members cm JOIN messages m ON m.conversation_id = cm.conversation_id WHERE m.id = read_receipts.message_id AND cm.user_id = auth.uid())
);
CREATE POLICY read_receipts_insert ON read_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
