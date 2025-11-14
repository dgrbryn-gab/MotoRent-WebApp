-- Create Storage Bucket for Motorcycle Images
-- This allows uploading motorcycle photos to Supabase Storage

-- Create the motorcycle-images bucket (if using Supabase CLI)
-- Note: Buckets are usually created via Dashboard, but we'll set policies here

-- =====================================================
-- STORAGE POLICIES FOR MOTORCYCLE IMAGES
-- =====================================================

-- Allow public access to view motorcycle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('motorcycle-images', 'motorcycle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view/download images
CREATE POLICY "Public can view motorcycle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'motorcycle-images');

-- Allow authenticated users to upload motorcycle images
CREATE POLICY "Authenticated users can upload motorcycle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'motorcycle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update motorcycle images
CREATE POLICY "Authenticated users can update motorcycle images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'motorcycle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete motorcycle images
CREATE POLICY "Authenticated users can delete motorcycle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'motorcycle-images' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- COMPLETED
-- =====================================================
-- Storage bucket created and policies set
-- Admins can now upload motorcycle images
