-- Set rohanchax@gmail.com topics
-- 1. Excel Tips & Tricks -> day 29
-- 2. Fun & Pop Culture (Ongoing) -> day 30
-- 3. Mental Health Awareness -> day 5
-- 4. World Events & Trends -> day 30

DO $$
DECLARE
  user_record_id UUID;
  excel_tips_topic_id UUID;
  fun_pop_culture_topic_id UUID;
  mental_health_topic_id UUID;
  world_events_topic_id UUID;
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

  -- Get Excel Tips & Tricks topic ID
  SELECT id INTO excel_tips_topic_id
  FROM public.topics
  WHERE name = 'Excel Tips & Tricks'
  LIMIT 1;

  IF excel_tips_topic_id IS NULL THEN
    RAISE EXCEPTION 'Excel Tips & Tricks topic not found';
  END IF;

  -- Get Fun & Pop Culture (Ongoing) topic ID
  SELECT id INTO fun_pop_culture_topic_id
  FROM public.topics
  WHERE name = 'Fun & Pop Culture (Ongoing)'
  LIMIT 1;

  IF fun_pop_culture_topic_id IS NULL THEN
    RAISE EXCEPTION 'Fun & Pop Culture (Ongoing) topic not found';
  END IF;

  -- Get Mental Health Awareness topic ID
  SELECT id INTO mental_health_topic_id
  FROM public.topics
  WHERE name = 'Mental Health Awareness'
  LIMIT 1;

  IF mental_health_topic_id IS NULL THEN
    RAISE EXCEPTION 'Mental Health Awareness topic not found';
  END IF;

  -- Get World Events & Trends topic ID (try both possible names)
  SELECT id INTO world_events_topic_id
  FROM public.topics
  WHERE name = 'World Events & Trends' OR name = 'Cultural Awareness & Global Events'
  LIMIT 1;

  IF world_events_topic_id IS NULL THEN
    RAISE EXCEPTION 'World Events & Trends topic not found';
  END IF;

  -- Verify day 30 exists for World Events before setting it
  IF NOT EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE topic_id = world_events_topic_id
      AND day_number = 30
  ) THEN
    -- Find max day that exists
    SELECT COALESCE(MAX(day_number), 1) INTO max_day
    FROM public.quizzes
    WHERE topic_id = world_events_topic_id;
    
    RAISE WARNING 'Day 30 does not exist for World Events & Trends. Max day is %. Setting to day % instead.', max_day, max_day;
  END IF;

  -- Update Excel Tips & Tricks to day 29
  INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days, unlock_day)
  VALUES (user_record_id, excel_tips_topic_id, 29, 28, 29)
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    current_day = 29,
    completed_days = 28,
    unlock_day = 29;

  RAISE NOTICE 'Updated Excel Tips & Tricks to day 29';

  -- Update Fun & Pop Culture (Ongoing) to day 30 (unlocked and ready)
  INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days, unlock_day)
  VALUES (user_record_id, fun_pop_culture_topic_id, 30, 29, 30)
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    current_day = 30,
    completed_days = 29,
    unlock_day = 30;

  RAISE NOTICE 'Updated Fun & Pop Culture (Ongoing) to day 30 (unlocked)';

  -- Update Mental Health Awareness to day 5
  INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days, unlock_day)
  VALUES (user_record_id, mental_health_topic_id, 5, 4, 5)
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    current_day = 5,
    completed_days = 4,
    unlock_day = 5;

  RAISE NOTICE 'Updated Mental Health Awareness to day 5 (unlocked)';

  -- Update World Events & Trends to day 30 (or max available if 30 doesn't exist)
  SELECT COALESCE(MAX(day_number), 30) INTO max_day
  FROM public.quizzes
  WHERE topic_id = world_events_topic_id;
  
  -- Cap at 30 if max is higher (shouldn't happen, but safety check)
  max_day := LEAST(max_day, 30);
  
  INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days, unlock_day)
  VALUES (user_record_id, world_events_topic_id, max_day, max_day - 1, max_day)
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    current_day = max_day,
    completed_days = max_day - 1,
    unlock_day = max_day;

  RAISE NOTICE 'Updated World Events & Trends to day % (unlocked)', max_day;
END $$;

-- Verify the updates
SELECT 
  u.email,
  t.name as topic_name,
  ut.current_day,
  ut.completed_days,
  ut.unlock_day
FROM public.users u
JOIN public.user_topics ut ON u.id = ut.user_id
JOIN public.topics t ON ut.topic_id = t.id
WHERE u.email = 'rohanchax@gmail.com' 
  AND t.name IN ('Excel Tips & Tricks', 'Fun & Pop Culture (Ongoing)', 'Mental Health Awareness', 'World Events & Trends', 'Cultural Awareness & Global Events')
ORDER BY t.name;

