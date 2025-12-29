-- 1. Grant explicit UPDATE privilege to authenticated role on questions table
GRANT UPDATE ON public.questions TO authenticated;

-- 2. Drop existing UPDATE policy and recreate with proper clauses
DROP POLICY IF EXISTS "Admin/Editor can update questions" ON public.questions;

CREATE POLICY "Admin/Editor can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor(auth.uid()))
WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- 3. Create secure RPC function for soft delete with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.soft_delete_questions(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Verify caller has admin or editor role
  IF NOT public.is_admin_or_editor(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: requires admin or editor role';
  END IF;

  -- Perform soft delete
  UPDATE public.questions
  SET status = 'deleted', updated_at = now()
  WHERE id = ANY(p_ids) AND status != 'deleted';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

-- 4. Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_questions(uuid[]) TO authenticated;