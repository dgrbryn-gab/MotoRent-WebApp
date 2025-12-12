-- Fix Document Storage RLS Policies
-- The issue is that the storage policies need proper type casting for folder name matching

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Recreate policies with proper type casting
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1]::text = auth.uid()::text
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1]::text = auth.uid()::text
);

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1]::text = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1]::text = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1]::text = auth.uid()::text
);

-- Note: Admin policy for viewing all documents is still intact
COMMENT ON POLICY "Users can upload their own documents" ON storage.objects IS 
  'Allows authenticated users to upload documents to their own folder (user_id/filename)';
