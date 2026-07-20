-- Helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conv_id AND user_id = auth.uid());
$$;

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
  WITH CHECK (auth.uid() = id AND public.get_user_role() = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated
  USING (public.is_conversation_member(id) OR created_by = auth.uid());

CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (type = 'direct' OR public.is_admin());

CREATE POLICY "conversations_update_admin" ON conversations FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "cm_select" ON conversation_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "cm_insert_admin" ON conversation_members;
CREATE POLICY "cm_insert" ON conversation_members FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id AND c.type = 'direct' AND c.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "cm_delete_admin" ON conversation_members FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));

CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id));

CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (sender_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "attachments_select" ON attachments FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));

CREATE POLICY "attachments_insert" ON attachments FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "mr_select" ON message_reads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "mr_insert" ON message_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
