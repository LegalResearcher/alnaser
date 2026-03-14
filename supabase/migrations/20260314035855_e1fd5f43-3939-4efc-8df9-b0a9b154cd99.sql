
CREATE TABLE public.question_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  suggested_answer TEXT,
  note TEXT,
  image_url TEXT,
  reporter_name TEXT,
  reporter_level TEXT,
  reporter_batch TEXT,
  reporter_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can report questions"
  ON public.question_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view reports"
  ON public.question_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports"
  ON public.question_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reports"
  ON public.question_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('report-images', 'report-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload report images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-images');
CREATE POLICY "Report images are public"
  ON storage.objects FOR SELECT USING (bucket_id = 'report-images');
CREATE POLICY "Admins can delete report images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'report-images' AND public.has_role(auth.uid(), 'admin'));
