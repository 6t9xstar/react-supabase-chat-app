-- Create storage bucket + RLS policies for file attachments
-- Run this in Supabase SQL Editor or include in migrations

-- Insert into storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Allow members of conversation to read files
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

-- Allow sender to delete own files
CREATE POLICY "owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
