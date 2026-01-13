-- Set Power BI Basics to day 30 for rohanchax@gmail.com

DO $$
DECLARE
  user_record_id UUID;
  power_bi_topic_id UUID;
  max_day INTEGER;
BEGIN
  -- Get the user ID
  SELECT id INTO user_record_id
  FROM public.users
  WHERE email = 'rohanchax@gmail.com'
  LIMIT 1;

  IF user_record_id IS NULL THEN
    RAISE EXCEPTION 'User with email rohanchax@gmail.com not found';
  END IF;

  -- Get Power BI Basics topic ID
  SELECT id INTO power_bi_topic_id
  FROM public.topics
  WHERE name = 'Power BI Basics'
  LIMIT 1;

  IF power_bi_topic_id IS NULL THEN
    RAISE EXCEPTION 'Power BI Basics topic not found';
  END IF;

  -- Get max day for Power BI Basics (cap at 30)
  SELECT LEAST(MAX(day_number), 30) INTO max_day
  FROM public.quizzes
  WHERE topic_id = power_bi_topic_id;

  IF max_day IS NULL THEN
    RAISE EXCEPTION 'No quizzes found for Power BI Basics';
  END IF;

  -- Update or insert user_topic
  INSERT INTO public.user_topics (user_id, topic_id, current_day, unlock_day, completed_days)
  VALUES (user_record_id, power_bi_topic_id, max_day, max_day, max_day - 1)
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    current_day = max_day,
    unlock_day = max_day,
    completed_days = max_day - 1;

  RAISE NOTICE 'Successfully set Power BI Basics to day % for user %', max_day, user_record_id;
END $$;

-- Verify the update
SELECT 
    u.email,
    t.name as topic_name,
    ut.current_day,
    ut.unlock_day,
    ut.completed_days
FROM public.user_topics ut
JOIN public.users u ON ut.user_id = u.id
JOIN public.topics t ON ut.topic_id = t.id
WHERE u.email = 'rohanchax@gmail.com'
  AND t.name = 'Power BI Basics';
