CREATE INDEX idx_cm_user ON conversation_members(user_id);
CREATE INDEX idx_cm_conversation ON conversation_members(conversation_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC, id DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_conversation ON attachments(conversation_id);
CREATE INDEX idx_mr_lookup ON message_reads(message_id, user_id);
