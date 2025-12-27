-- Add exam_form column to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_form TEXT DEFAULT 'General';

-- Update the get_question_count function to support exam_form filtering
CREATE OR REPLACE FUNCTION public.get_question_count(
  p_subject_id uuid, 
  p_exam_year integer DEFAULT NULL::integer,
  p_exam_form text DEFAULT NULL::text
)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM public.questions
  WHERE subject_id = p_subject_id
    AND status = 'active'
    AND (p_exam_year IS NULL OR exam_year = p_exam_year)
    AND (p_exam_form IS NULL OR exam_form = p_exam_form)
$function$;