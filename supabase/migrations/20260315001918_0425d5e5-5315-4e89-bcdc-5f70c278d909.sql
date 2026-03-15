ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS reviewer_credit TEXT;

ALTER TABLE public.question_reports
  ADD COLUMN IF NOT EXISTS exam_year INTEGER,
  ADD COLUMN IF NOT EXISTS exam_form TEXT,
  ADD COLUMN IF NOT EXISTS level_name TEXT;