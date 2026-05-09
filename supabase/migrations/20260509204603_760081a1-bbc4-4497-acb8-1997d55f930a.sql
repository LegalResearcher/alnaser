CREATE TABLE public.review_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  password text NOT NULL,
  label text DEFAULT NULL,
  device_fingerprint text DEFAULT NULL,
  first_used_at timestamptz DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_review_passwords_subject ON public.review_passwords(subject_id);
CREATE INDEX idx_review_passwords_lookup ON public.review_passwords(subject_id, password) WHERE is_active = true;

ALTER TABLE public.review_passwords ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage review passwords"
ON public.review_passwords FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public can read active passwords (needed for verification by anonymous students)
CREATE POLICY "Public can read active review passwords"
ON public.review_passwords FOR SELECT
TO public
USING (is_active = true);

-- Public can update for first-use registration (device_fingerprint, first_used_at, expires_at)
CREATE POLICY "Public can update review passwords for first use"
ON public.review_passwords FOR UPDATE
TO public
USING (is_active = true)
WITH CHECK (is_active = true);