-- =============================================
-- FINAL RLS FIX - Handles edge cases
-- =============================================
-- Run this if COMPREHENSIVE_RLS_FIX.sql didn't work

-- Drop everything
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;
DROP FUNCTION IF EXISTS public.get_current_user_id();

-- Ensure RLS is on
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create a security definer function that can bypass RLS for the subquery
-- This ensures the subquery can always read from users table
CREATE OR REPLACE FUNCTION public.get_user_id_for_auth()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_id_result uuid;
BEGIN
  SELECT id INTO user_id_result
  FROM public.users
  WHERE auth_id = auth.uid()
  LIMIT 1;
  
  RETURN user_id_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_id_for_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_for_auth() TO anon;

-- Now use this function in policies
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (user_id = public.get_user_id_for_auth());

CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (user_id = public.get_user_id_for_auth());

CREATE POLICY "Users can update their own attempts" 
ON public.quiz_attempts FOR UPDATE 
USING (user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = public.get_user_id_for_auth());

CREATE POLICY "Users can delete their own attempts" 
ON public.quiz_attempts FOR DELETE 
USING (user_id = public.get_user_id_for_auth());

-- Verify
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;
