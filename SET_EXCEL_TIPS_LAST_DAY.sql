-- Set user rohanchax@gmail to be on the last day for Excel Tips topic
-- This allows testing the topic completion and deletion feature

-- First, find the Excel Tips topic and the max day number
DO $$
DECLARE
  excel_tips_topic_id UUID;
  max_day_number INTEGER;
  user_record_id UUID;
BEGIN
  -- Get the Excel Tips topic ID
  SELECT id INTO excel_tips_topic_id
  FROM public.topics
  WHERE name = 'Excel Tips & Tricks'
  LIMIT 1;

  IF excel_tips_topic_id IS NULL THEN
    RAISE EXCEPTION 'Excel Tips & Tricks topic not found';
  END IF;

  -- Excel Tips should only have 30 days maximum
  -- Cap at 30 even if more exist in database
  SELECT LEAST(COALESCE(MAX(day_number), 1), 30) INTO max_day_number
  FROM public.quizzes
  WHERE topic_id = excel_tips_topic_id
    AND day_number <= 30;

  -- Get the user ID
  SELECT id INTO user_record_id
  FROM public.users
  WHERE email = 'rohanchax@gmail.com'
  LIMIT 1;

  IF user_record_id IS NULL THEN
    RAISE EXCEPTION 'User with email rohanchax@gmail.com not found';
  END IF;

  -- Update or insert the user_topic to be on the last day
  -- Set current_day to max_day_number and completed_days to max_day_number - 1
  -- This way they're on the last day and can complete it to test deletion
  INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days, unlock_day)
  VALUES (user_record_id, excel_tips_topic_id, max_day_number, max_day_number - 1, max_day_number)
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    current_day = max_day_number,
    completed_days = max_day_number - 1,
    unlock_day = max_day_number;

  RAISE NOTICE 'Updated user rohanchax@gmail.com Excel Tips topic to day % (last day)', max_day_number;
END $$;

-- Verify the update
SELECT 
  u.email,
  t.name as topic_name,
  ut.current_day,
  ut.completed_days,
  ut.unlock_day,
  (SELECT MAX(day_number) FROM public.quizzes WHERE topic_id = ut.topic_id) as max_available_day
FROM public.users u
JOIN public.user_topics ut ON u.id = ut.user_id
JOIN public.topics t ON ut.topic_id = t.id
WHERE u.email = 'rohanchax@gmail.com' AND t.name = 'Excel Tips & Tricks';

