-- =============================================
-- WORKING FIX FOR QUIZ_ATTEMPTS RLS POLICY
-- =============================================
-- This version uses a security definer function approach
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- First, let's create a helper function to get the current user's id
-- This function returns the user.id that matches the authenticated auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Now create SELECT policy using the function
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (user_id = public.get_current_user_id());

-- Create INSERT policy
CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (user_id = public.get_current_user_id());

-- Create UPDATE policy
CREATE POLICY "Users can update their own attempts" 
ON public.quiz_attempts FOR UPDATE 
USING (user_id = public.get_current_user_id());

-- Create DELETE policy
CREATE POLICY "Users can delete their own attempts" 
ON public.quiz_attempts FOR DELETE 
USING (user_id = public.get_current_user_id());

-- Verify policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;


