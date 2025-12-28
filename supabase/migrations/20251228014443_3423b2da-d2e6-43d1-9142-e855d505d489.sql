-- Drop the existing update policy
DROP POLICY IF EXISTS "Admin/Editor can update questions" ON public.questions;

-- Create a new update policy with both USING and WITH CHECK clauses
CREATE POLICY "Admin/Editor can update questions" 
ON public.questions 
FOR UPDATE 
TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));