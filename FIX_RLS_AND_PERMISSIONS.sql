-- =============================================
-- FIX RLS POLICIES AND TABLE PERMISSIONS
-- =============================================
-- Error 42501 means missing GRANT permissions
-- Run this in Supabase SQL Editor

-- Step 1: Ensure authenticated and anon roles can access the table
-- This is critical - RLS policies alone aren't enough if roles can't access the table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO anon;

-- Also ensure users table is accessible
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can select own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz_attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Step 3: Drop any functions
DROP FUNCTION IF EXISTS public.get_current_user_id();
DROP FUNCTION IF EXISTS public.get_user_id_for_auth();

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create clean policies using simple subquery
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
TO authenticated, anon
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
TO authenticated, anon
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own attempts" 
ON public.quiz_attempts FOR UPDATE 
TO authenticated, anon
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
TO authenticated, anon
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Step 6: Verify grants
SELECT 
  'Table permissions:' as info,
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'quiz_attempts'
  AND grantee IN ('authenticated', 'anon');

-- Step 7: Verify policies
SELECT 
  'RLS Policies:' as info,
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'quiz_attempts'
ORDER BY policyname, cmd;

SELECT 'Fix complete! Refresh your app.' as info;

