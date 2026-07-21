-- 010: Fix RLS recursion + backfill missing profiles

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update_admin" ON conversations;
DROP POLICY IF EXISTS "cm_select" ON conversation_members;
DROP POLICY IF EXISTS "cm_insert_admin" ON conversation_members;
DROP POLICY IF EXISTS "cm_delete_admin" ON conversation_members;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "attachments_select" ON attachments;
DROP POLICY IF EXISTS "attachments_insert" ON attachments;
DROP POLICY IF EXISTS "mr_select" ON message_reads;
DROP POLICY IF EXISTS "mr_insert" ON message_reads;
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "member_read" ON storage.objects;
DROP POLICY IF EXISTS "owner_delete" ON storage.objects;

-- Create SECURITY DEFINER helpers (bypass RLS to avoid recursion)
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

-- Recreate all policies using helpers
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));

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
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "attachments_select" ON attachments FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));

CREATE POLICY "attachments_insert" ON attachments FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id));

CREATE POLICY "mr_select" ON message_reads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "mr_insert" ON message_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "member_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Backfill missing profiles for all auth users
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE WHEN u.email = 'admin@apexchat.com' THEN 'admin' ELSE 'employee' END,
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
