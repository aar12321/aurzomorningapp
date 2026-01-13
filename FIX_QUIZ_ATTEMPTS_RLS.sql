-- =============================================
-- FIX QUIZ_ATTEMPTS RLS POLICY
-- =============================================
-- Run this in Supabase SQL Editor to fix the 403 errors
-- The issue is the subquery in the policy doesn't work with joins

-- Drop ALL existing policies to clean up
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Create a better SELECT policy using EXISTS with explicit table reference
-- This works correctly with joins in queries
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = quiz_attempts.user_id 
    AND users.auth_id = auth.uid()
  )
);

-- Skip admin policy if user_roles table doesn't exist
-- (Uncomment below if you have admin roles table)
-- CREATE POLICY "Admins can view all attempts" 
-- ON public.quiz_attempts FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.users u
--     JOIN public.user_roles ur ON u.id = ur.user_id
--     WHERE u.auth_id = auth.uid() 
--     AND ur.role IN ('admin', 'super_admin')
--   )
-- );

-- Ensure INSERT policy is correct
CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = quiz_attempts.user_id 
    AND users.auth_id = auth.uid()
  )
);

-- Allow UPDATE and DELETE (optional, if needed)
CREATE POLICY "Users can update their own attempts" 
ON public.quiz_attempts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = quiz_attempts.user_id 
    AND users.auth_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attempts" 
ON public.quiz_attempts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = quiz_attempts.user_id 
    AND users.auth_id = auth.uid()
  )
);

-- Verify the policies were created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname;

