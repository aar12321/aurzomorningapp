-- =============================================
-- STEP-BY-STEP RLS FIX
-- =============================================
-- Run each section separately in Supabase SQL Editor

-- STEP 1: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow signup insert" ON public.users;

-- STEP 2: Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create permissive policies
CREATE POLICY "Allow signup insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- STEP 5: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_topics_data JSONB;
  topic_names TEXT[];
  topic_record RECORD;
  new_user_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO public.users (auth_id, full_name, email, timezone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'timezone', 'America/New_York')
  ) RETURNING id INTO new_user_id;

  -- Handle selected topics
  user_topics_data := new.raw_user_meta_data->'selected_topics';
  
  IF user_topics_data IS NOT NULL AND jsonb_array_length(user_topics_data) > 0 THEN
    -- Convert JSON array to text array
    SELECT array_agg(value::text) INTO topic_names
    FROM jsonb_array_elements_text(user_topics_data);
    
    -- Create user_topics entries
    FOR topic_record IN 
      SELECT id FROM public.topics WHERE name IN (
        SELECT unnest(topic_names)
      )
    LOOP
      INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days)
      VALUES (new_user_id, topic_record.id, 1, 0);
    END LOOP;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- STEP 7: Test the setup
SELECT 'Migration completed successfully!' as status;
