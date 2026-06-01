ALTER TABLE subjects ADD COLUMN IF NOT EXISTS show_subscription boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  phone_number text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  subject_name text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  review_password_id uuid REFERENCES review_passwords(id) ON DELETE SET NULL,
  notes text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz DEFAULT NULL
);

GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_payment_requests" ON payment_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_read_payment_requests" ON payment_requests
  FOR SELECT USING (true);

CREATE POLICY "allow_update_payment_requests" ON payment_requests
  FOR UPDATE USING (true);