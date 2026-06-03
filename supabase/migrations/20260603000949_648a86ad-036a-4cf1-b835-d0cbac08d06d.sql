-- 1. إنشاء جدول platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Grants for platform_settings
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.platform_settings
  FOR ALL USING (true);

-- 2. إصلاح foreign key ليسمح بالحذف (SET NULL)
ALTER TABLE public.payment_requests
  DROP CONSTRAINT IF EXISTS payment_requests_review_password_id_fkey;

ALTER TABLE public.payment_requests
  ADD CONSTRAINT payment_requests_review_password_id_fkey
  FOREIGN KEY (review_password_id)
  REFERENCES public.review_passwords(id)
  ON DELETE SET NULL;

-- 3. إضافة سياسة حذف للمشرفين فقط
CREATE POLICY "Admin can delete payment_requests"
  ON public.payment_requests
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));