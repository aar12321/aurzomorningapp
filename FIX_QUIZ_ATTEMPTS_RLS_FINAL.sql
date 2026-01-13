-- =============================================
-- FINAL FIX FOR QUIZ_ATTEMPTS RLS POLICY
-- =============================================
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Create SELECT policy that works with joins
-- Using a simpler approach: check user_id against current user's id
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Create INSERT policy
CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Create UPDATE policy
CREATE POLICY "Users can update their own attempts" 
ON public.quiz_attempts FOR UPDATE 
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Create DELETE policy
CREATE POLICY "Users can delete their own attempts" 
ON public.quiz_attempts FOR DELETE 
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Verify policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;


