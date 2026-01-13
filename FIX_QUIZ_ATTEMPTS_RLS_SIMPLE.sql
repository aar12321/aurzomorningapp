-- =============================================
-- SIMPLE DIRECT FIX FOR QUIZ_ATTEMPTS RLS
-- =============================================
-- This uses a direct subquery that Supabase RLS can handle
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Drop the function if it exists (from previous attempts)
DROP FUNCTION IF EXISTS public.get_current_user_id();

-- Create SELECT policy - using the EXACT same pattern as the original migration
-- But we'll ensure it's the ONLY policy
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Create INSERT policy - same pattern as original
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
)
WITH CHECK (
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

-- Verify policies were created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;

