-- Fix user topics creation during signup
-- This will update the handle_new_user function to also create user_topics

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_user_id UUID;
  user_topics_data JSONB;
  topic_record RECORD;
  topic_names TEXT[];
BEGIN
  -- Insert user profile
  INSERT INTO public.users (auth_id, full_name, email, timezone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'timezone', 'America/New_York')
  )
  RETURNING id INTO new_user_id;

  -- Get the selected topics from user metadata
  user_topics_data := new.raw_user_meta_data->'selected_topics';
  
  -- If topics are provided, create user_topics entries
  IF user_topics_data IS NOT NULL AND jsonb_array_length(user_topics_data) > 0 THEN
    -- Convert JSON array to text array
    SELECT array_agg(value::text) INTO topic_names
    FROM jsonb_array_elements_text(user_topics_data);
    
    -- Map topic IDs to database topic names based on signup form
    FOR topic_record IN 
      SELECT id FROM public.topics 
      WHERE (topic_names && ARRAY['geometry'] AND name = 'Geometry')
         OR (topic_names && ARRAY['calculus'] AND name = 'Calculus')
         OR (topic_names && ARRAY['algebra'] AND name = 'Algebra')
         OR (topic_names && ARRAY['english'] AND name = 'English')
         OR (topic_names && ARRAY['sat'] AND name = 'SAT/ACT Practice')
         OR (topic_names && ARRAY['chemistry'] AND name = 'Chemistry')
         OR (topic_names && ARRAY['biology'] AND name = 'Biology')
         OR (topic_names && ARRAY['general-science'] AND name = 'General Science')
         OR (topic_names && ARRAY['financial'] AND name = 'Financial Literacy')
         OR (topic_names && ARRAY['business'] AND name = 'Business')
         OR (topic_names && ARRAY['knowledge'] AND name = 'General Knowledge')
         OR (topic_names && ARRAY['world'] AND name = 'World Events')
         OR (topic_names && ARRAY['ai'] AND name = 'AI & Tech')
    LOOP
      INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days)
      VALUES (new_user_id, topic_record.id, 1, 0);
    END LOOP;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

