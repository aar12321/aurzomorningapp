-- Fix Excel Tips & Tricks: Remove all quizzes beyond day 30
-- Excel Tips should only have 30 days maximum

DO $$
DECLARE
  excel_tips_topic_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get the Excel Tips topic ID
  SELECT id INTO excel_tips_topic_id
  FROM public.topics
  WHERE name = 'Excel Tips & Tricks'
  LIMIT 1;

  IF excel_tips_topic_id IS NULL THEN
    RAISE EXCEPTION 'Excel Tips & Tricks topic not found';
  END IF;

  -- Delete all quizzes beyond day 30
  DELETE FROM public.quizzes
  WHERE topic_id = excel_tips_topic_id
    AND day_number > 30;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % quizzes beyond day 30 for Excel Tips & Tricks', deleted_count;

  -- Also update any user_topics that are beyond day 30
  -- Set them to day 30 if they're on a day that no longer exists
  UPDATE public.user_topics
  SET current_day = 30,
      unlock_day = LEAST(unlock_day, 30)
  WHERE topic_id = excel_tips_topic_id
    AND (current_day > 30 OR unlock_day > 30);

  RAISE NOTICE 'Updated user_topics to max day 30 for Excel Tips & Tricks';
END $$;

-- Verify: Show remaining Excel Tips quizzes
SELECT 
  t.name as topic_name,
  q.day_number,
  COUNT(qu.id) as question_count
FROM public.topics t
JOIN public.quizzes q ON t.id = q.topic_id
LEFT JOIN public.questions qu ON q.id = qu.quiz_id
WHERE t.name = 'Excel Tips & Tricks'
GROUP BY t.name, q.day_number
ORDER BY q.day_number;

-- Show max day
SELECT 
  t.name as topic_name,
  MAX(q.day_number) as max_day,
  COUNT(DISTINCT q.id) as total_quizzes
FROM public.topics t
JOIN public.quizzes q ON t.id = q.topic_id
WHERE t.name = 'Excel Tips & Tricks'
GROUP BY t.name;

