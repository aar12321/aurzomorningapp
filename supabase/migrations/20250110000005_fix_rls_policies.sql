-- Fix RLS policies to allow user creation during signup
-- Allow users to insert their own profile during signup process
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = auth_id OR auth.uid() IS NOT NULL);

-- Allow users to insert their own topics during signup
DROP POLICY IF EXISTS "Users can insert their own topics" ON public.user_topics;

CREATE POLICY "Users can insert their own topics" 
ON public.user_topics FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR auth.uid() IS NOT NULL);

-- Allow users to insert their own quiz attempts
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;

CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR auth.uid() IS NOT NULL);
