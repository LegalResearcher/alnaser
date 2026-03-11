-- 1. إضافة أعمدة لجدول exam_results
ALTER TABLE public.exam_results
  ADD COLUMN IF NOT EXISTS score_percentage INTEGER,
  ADD COLUMN IF NOT EXISTS challenge_session_id UUID;

UPDATE public.exam_results
SET score_percentage = ROUND((score::numeric / NULLIF(total_questions, 0)) * 100)
WHERE score_percentage IS NULL;

-- 2. جدول إحصائيات الأسئلة
CREATE TABLE IF NOT EXISTS public.question_stats (
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  total_answers INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  option_a_count INTEGER NOT NULL DEFAULT 0,
  option_b_count INTEGER NOT NULL DEFAULT 0,
  option_c_count INTEGER NOT NULL DEFAULT 0,
  option_d_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id)
);

ALTER TABLE public.question_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view question stats" ON public.question_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert question stats" ON public.question_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update question stats" ON public.question_stats FOR UPDATE USING (true);

-- 3. جدول جلسات المبارزة
CREATE TABLE IF NOT EXISTS public.challenge_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_score INTEGER,
  creator_percentage INTEGER,
  creator_time_seconds INTEGER,
  question_ids JSONB NOT NULL,
  exam_year INTEGER,
  exam_form TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. جدول نتائج المبارزة
CREATE TABLE IF NOT EXISTS public.challenge_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.challenge_sessions(id) ON DELETE CASCADE,
  challenger_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge sessions" ON public.challenge_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert challenge sessions" ON public.challenge_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update challenge sessions" ON public.challenge_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can view challenge results" ON public.challenge_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert challenge results" ON public.challenge_results FOR INSERT WITH CHECK (true);

-- 5. دالة تحديث إحصائيات الأسئلة
CREATE OR REPLACE FUNCTION public.record_question_answer(
  p_question_id UUID,
  p_selected_option TEXT,
  p_is_correct BOOLEAN
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.question_stats (
    question_id, total_answers, correct_answers,
    option_a_count, option_b_count, option_c_count, option_d_count
  )
  VALUES (
    p_question_id, 1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_selected_option = 'A' THEN 1 ELSE 0 END,
    CASE WHEN p_selected_option = 'B' THEN 1 ELSE 0 END,
    CASE WHEN p_selected_option = 'C' THEN 1 ELSE 0 END,
    CASE WHEN p_selected_option = 'D' THEN 1 ELSE 0 END
  )
  ON CONFLICT (question_id) DO UPDATE SET
    total_answers   = question_stats.total_answers + 1,
    correct_answers = question_stats.correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    option_a_count  = question_stats.option_a_count + CASE WHEN p_selected_option = 'A' THEN 1 ELSE 0 END,
    option_b_count  = question_stats.option_b_count + CASE WHEN p_selected_option = 'B' THEN 1 ELSE 0 END,
    option_c_count  = question_stats.option_c_count + CASE WHEN p_selected_option = 'C' THEN 1 ELSE 0 END,
    option_d_count  = question_stats.option_d_count + CASE WHEN p_selected_option = 'D' THEN 1 ELSE 0 END,
    updated_at      = now();
END;
$$;