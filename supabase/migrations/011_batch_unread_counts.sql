-- Batch unread count function: replaces N+1 per-conversation queries with a single call
CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id UUID)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (m.conversation_id) m.conversation_id, m.id, m.created_at
    FROM messages m
    WHERE m.deleted_at IS NULL
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  read_positions AS (
    SELECT lm.conversation_id, COALESCE(mr.read_at, '1970-01-01'::timestamptz) AS cursor
    FROM latest_messages lm
    LEFT JOIN message_reads mr ON mr.message_id = lm.id AND mr.user_id = p_user_id
  )
  SELECT rp.conversation_id, COUNT(m.id)::BIGINT
  FROM read_positions rp
  JOIN messages m ON m.conversation_id = rp.conversation_id AND m.deleted_at IS NULL AND m.created_at > rp.cursor
  GROUP BY rp.conversation_id;
END;
$$;
