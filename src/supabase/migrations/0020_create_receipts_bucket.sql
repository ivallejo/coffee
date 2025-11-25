-- Create storage bucket for receipt logos and images
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for receipts bucket
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update receipts"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
);
