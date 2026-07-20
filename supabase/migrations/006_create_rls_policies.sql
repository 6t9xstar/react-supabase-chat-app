ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    type = 'direct'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "conversations_update_admin" ON conversations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "cm_select" ON conversation_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id
      AND cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "cm_insert_admin" ON conversation_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "cm_delete_admin" ON conversation_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (sender_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "attachments_select" ON attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = attachments.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "attachments_insert" ON attachments FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "mr_select" ON message_reads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "mr_insert" ON message_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
