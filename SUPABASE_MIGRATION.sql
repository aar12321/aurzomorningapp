-- =============================================
-- SUPABASE MIGRATION: Fix RLS Signup Issues
-- =============================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This will fix the "row violates row-level security policy" error

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own topics" ON public.user_topics;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;

-- Step 2: Create more permissive policies for signup
-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = auth_id);

-- Allow users to insert their own topics
CREATE POLICY "Users can insert their own topics" 
ON public.user_topics FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Allow users to insert their own attempts
CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Step 3: Create function to handle user creation during signup
-- This function runs with elevated privileges (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile automatically when auth user is created
  INSERT INTO public.users (auth_id, full_name, email, timezone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'timezone', 'America/New_York')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to automatically create user profile
-- This trigger runs after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Clean up the orphaned auth user (optional)
-- Uncomment the next line if you want to delete the existing orphaned user
-- DELETE FROM auth.users WHERE id = 'efd15620-6f3d-4af8-85a7-f81c7bd274dd';

-- Step 6: Verify the setup
-- Check if the trigger function was created successfully
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check if the trigger was created successfully
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- After running this SQL:
-- 1. Clear your browser cache
-- 2. Try signing up with a NEW email address
-- 3. The user profile should be created automatically
-- 4. You should be redirected to the dashboard successfully
