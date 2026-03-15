CREATE TABLE public.question_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'four' CHECK (question_type IN ('four','three','two','truefalse')),
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  hint TEXT,
  suggester_name TEXT,
  suggester_level TEXT,
  suggester_batch TEXT,
  suggester_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.question_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can suggest questions" ON public.question_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view suggestions" ON public.question_suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update suggestions" ON public.question_suggestions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete suggestions" ON public.question_suggestions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));