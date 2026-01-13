-- MANUAL FIX: Create user_topics for existing users
-- Run this in Supabase SQL Editor if users already signed up without topics

-- First, run the migration to update the function:
-- Copy the contents of: supabase/migrations/20250110000007_fix_user_topics_creation.sql

-- Then for existing users, manually create topics if needed:
-- Replace 'user-email@example.com' with actual user email

DO $$
DECLARE
  user_record RECORD;
  topic_record RECORD;
  user_auth_record RECORD;
BEGIN
  -- Find user by email
  SELECT * INTO user_record FROM public.users WHERE email = 'user-email@example.com';
  
  IF user_record IS NOT NULL THEN
    -- Get auth user metadata to find selected topics
    SELECT * INTO user_auth_record FROM auth.users WHERE id = user_record.auth_id;
    
    -- Check if topics already exist
    IF NOT EXISTS (
      SELECT 1 FROM public.user_topics WHERE user_id = user_record.id
    ) THEN
      -- If not, you can manually add topics
      -- Example: Add Geometry topic
      SELECT id INTO topic_record FROM public.topics WHERE name = 'Geometry' LIMIT 1;
      IF topic_record.id IS NOT NULL THEN
        INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days)
        VALUES (user_record.id, topic_record.id, 1, 0)
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- Add more topics as needed...
    END IF;
  END IF;
END $$;

