-- Create storage bucket + RLS policies for file attachments

-- Insert into storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "member_read" ON storage.objects;
CREATE POLICY "member_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "owner_delete" ON storage.objects;
CREATE POLICY "owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
