-- Fix quiz_attempts RLS policy to allow proper SELECT queries with joins
-- The issue is the subquery doesn't work well with joins

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Create a better SELECT policy using a function that checks user_id directly
-- This works better with joins
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = quiz_attempts.user_id 
    AND users.auth_id = auth.uid()
  )
);

-- Skip admin policy - only add if you have user_roles table
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

-- Ensure INSERT policy still works
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = quiz_attempts.user_id 
    AND users.auth_id = auth.uid()
  )
);

