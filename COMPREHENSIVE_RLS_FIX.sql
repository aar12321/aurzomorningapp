-- =============================================
-- COMPREHENSIVE RLS FIX FOR QUIZ_ATTEMPTS
-- =============================================
-- This script diagnoses and fixes RLS issues completely
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current RLS status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'quiz_attempts';

SELECT 'Current policies:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;

-- Step 2: Drop ALL existing policies (complete cleanup)
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Drop any functions we might have created
DROP FUNCTION IF EXISTS public.get_current_user_id();

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify users table RLS allows subqueries
-- Check if we can query users table for the subquery
SELECT 'Users table policies:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname, cmd;

-- Step 5: Create clean policies using the simplest possible pattern
-- This matches the original migration exactly
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

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

CREATE POLICY "Users can delete their own attempts" 
ON public.quiz_attempts FOR DELETE 
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Step 6: Verify policies were created
SELECT 'New policies:' as info;
SELECT policyname, cmd, 
  CASE 
    WHEN qual IS NULL THEN '(no qualifier)'
    ELSE substring(qual::text, 1, 100) || '...'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;

-- Step 7: Test query (should work if RLS is correct)
-- This simulates what the Dashboard does
SELECT 'Testing query...' as info;
SELECT 
  qa.id,
  qa.completed_at,
  COUNT(*) as attempt_count
FROM quiz_attempts qa
GROUP BY qa.id, qa.completed_at
ORDER BY qa.completed_at DESC
LIMIT 1;

SELECT 'RLS fix complete! Refresh your app to test.' as info;


