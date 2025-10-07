-- Create storage bucket for design reference images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-references',
  'design-references',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policies for design reference images
CREATE POLICY "Anyone can view design reference images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'design-references');

CREATE POLICY "Authenticated users can upload design reference images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'design-references' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own design reference images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'design-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own design reference images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'design-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);