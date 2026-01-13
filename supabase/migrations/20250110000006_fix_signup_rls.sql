-- Completely fix RLS policies for signup flow
-- Drop all existing policies that are causing issues
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own topics" ON public.user_topics;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;

-- Create more permissive policies for signup
-- Allow users to insert their own profile (relaxed for signup)
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = auth_id);

-- Allow users to insert their own topics (relaxed for signup)
CREATE POLICY "Users can insert their own topics" 
ON public.user_topics FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Allow users to insert their own attempts
CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Add a function to handle user creation during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, full_name, email, timezone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'America/New_York');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
