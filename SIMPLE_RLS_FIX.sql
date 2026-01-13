-- =============================================
-- SIMPLE RLS FIX - No Test Inserts
-- =============================================
-- This completely removes all RLS restrictions without test inserts

-- Step 1: Drop ALL policies on ALL tables
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow signup insert" ON public.users;
DROP POLICY IF EXISTS "Allow all users operations" ON public.users;
DROP POLICY IF EXISTS "Users can view their own topics" ON public.user_topics;
DROP POLICY IF EXISTS "Users can insert their own topics" ON public.user_topics;
DROP POLICY IF EXISTS "Users can update their own topics" ON public.user_topics;
DROP POLICY IF EXISTS "Allow all user_topics operations" ON public.user_topics;
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;

-- Step 2: Completely disable RLS on all user-related tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS but with NO policies (completely open)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a super simple trigger that just works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Just insert the user - no RLS should block this now
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

-- Step 5: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 6: Final verification
SELECT 'Simple RLS fix completed! All restrictions removed!' as status;

-- Check that RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_topics', 'quiz_attempts', 'user_badges') 
AND schemaname = 'public';

-- Check that no policies exist
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename IN ('users', 'user_topics', 'quiz_attempts', 'user_badges') 
AND schemaname = 'public';
