
-- جدول ملفات الطلاب الشخصية
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL UNIQUE,
  total_exams INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_exam_date DATE,
  badges JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.student_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.student_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.student_profiles FOR UPDATE USING (true);

-- دالة تحديث ملف الطالب بعد كل اختبار
CREATE OR REPLACE FUNCTION public.update_student_profile(
  p_student_name TEXT,
  p_score INTEGER,
  p_total_questions INTEGER,
  p_passed BOOLEAN
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_score_pct INTEGER;
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_streak INTEGER;
BEGIN
  v_score_pct := ROUND((p_score::numeric / NULLIF(p_total_questions, 0)) * 100);
  SELECT last_exam_date, current_streak INTO v_last_date, v_streak
  FROM public.student_profiles WHERE student_name = p_student_name;
  IF NOT FOUND THEN
    INSERT INTO public.student_profiles (
      student_name, total_exams, total_correct, total_questions_answered,
      best_score, current_streak, longest_streak, last_exam_date
    ) VALUES (p_student_name, 1, p_score, p_total_questions, v_score_pct, 1, 1, v_today);
  ELSE
    IF v_last_date = v_today - 1 THEN v_streak := v_streak + 1;
    ELSIF v_last_date < v_today - 1 THEN v_streak := 1;
    END IF;
    UPDATE public.student_profiles SET
      total_exams = total_exams + 1,
      total_correct = total_correct + p_score,
      total_questions_answered = total_questions_answered + p_total_questions,
      best_score = GREATEST(best_score, v_score_pct),
      current_streak = v_streak,
      longest_streak = GREATEST(longest_streak, v_streak),
      last_exam_date = v_today,
      updated_at = now()
    WHERE student_name = p_student_name;
  END IF;
END;
$$;
