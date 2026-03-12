ALTER TABLE public.deletion_requests
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'delete',
  ADD COLUMN IF NOT EXISTS question_data jsonb,
  ADD COLUMN IF NOT EXISTS target_question_id uuid REFERENCES public.questions(id);

-- Make question_id nullable since add requests don't have a target question
ALTER TABLE public.deletion_requests ALTER COLUMN question_id DROP NOT NULL;