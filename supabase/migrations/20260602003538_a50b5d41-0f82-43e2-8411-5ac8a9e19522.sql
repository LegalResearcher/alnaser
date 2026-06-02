ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS receipt_image_url TEXT,
  ADD COLUMN IF NOT EXISTS wallet_type TEXT;

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');