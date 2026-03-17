
CREATE TABLE public.subject_exam_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  form_name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, form_id)
);

ALTER TABLE public.subject_exam_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can manage exam forms"
  ON public.subject_exam_forms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Anyone can view exam forms"
  ON public.subject_exam_forms FOR SELECT TO public
  USING (true);
