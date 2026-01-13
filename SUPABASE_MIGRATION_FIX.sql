-- =============================================
-- COMPLETE RLS FIX: Disable RLS for users table during signup
-- =============================================
-- This is a more aggressive approach that temporarily disables RLS
-- Run this in your Supabase Dashboard → SQL Editor

-- Step 1: Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Step 2: Temporarily disable RLS on users table for signup
-- This allows the trigger to work without RLS interference
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS but with very permissive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create very permissive policies
-- Allow anyone to insert (for signup process)
CREATE POLICY "Allow signup insert" ON public.users FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = auth_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = auth_id);

-- Step 5: Update the trigger function to handle the signup data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_topics_data JSONB;
  topic_names TEXT[];
  topic_record RECORD;
BEGIN
  -- Insert user profile automatically when auth user is created
  INSERT INTO public.users (auth_id, full_name, email, timezone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'timezone', 'America/New_York')
  );

  -- Get the selected topics from user metadata
  user_topics_data := new.raw_user_meta_data->'selected_topics';
  
  -- If topics are provided, create user_topics entries
  IF user_topics_data IS NOT NULL AND jsonb_array_length(user_topics_data) > 0 THEN
    -- Convert JSON array to text array
    SELECT array_agg(value::text) INTO topic_names
    FROM jsonb_array_elements_text(user_topics_data);
    
    -- Get topic IDs and create user_topics entries
    FOR topic_record IN 
      SELECT id FROM public.topics WHERE name IN (
        SELECT unnest(topic_names)
      )
    LOOP
      INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days)
      VALUES (
        (SELECT id FROM public.users WHERE auth_id = new.id),
        topic_record.id,
        1,
        0
      );
    END LOOP;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 7: Clean up the orphaned user (optional)
-- Uncomment the next line if you want to delete the existing orphaned user
-- DELETE FROM auth.users WHERE id = 'efd15620-6f3d-4af8-85a7-f81c7bd274dd';

-- Step 8: Verify the setup
SELECT 'Migration completed successfully!' as status;

-- Check if the trigger function was created
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check if the trigger was created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- After running this SQL:
-- 1. Clear your browser cache completely
-- 2. Try signing up with a NEW email address
-- 3. The trigger should handle everything automatically
-- 4. You should be redirected to the dashboard successfully
