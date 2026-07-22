-- Sidebar last-message lookup: replaces pulling every non-deleted message across
-- all conversations with a single DISTINCT ON query (one row per conversation).
CREATE OR REPLACE FUNCTION get_last_messages(p_conversation_ids UUID[])
RETURNS TABLE(
  conversation_id UUID,
  id UUID,
  content TEXT,
  sender_id UUID,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT ON (m.conversation_id)
    m.conversation_id,
    m.id,
    m.content,
    m.sender_id,
    m.created_at,
    m.deleted_at
  FROM messages m
  WHERE m.conversation_id = ANY(p_conversation_ids)
    AND m.deleted_at IS NULL
  ORDER BY m.conversation_id, m.created_at DESC, m.id DESC
$$;
