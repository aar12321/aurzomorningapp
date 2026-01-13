-- This script ensures ALL quizzes in the database match EXACTLY what's in quizzes.csv
-- It will:
-- 1. Delete all quizzes that don't exist in the CSV
-- 2. Create quizzes that exist in CSV but not in database
-- 3. Ensure day numbers match exactly

-- IMPORTANT: This script requires manual CSV analysis first
-- Run this to see what needs to be fixed, then manually fix or use the Node.js script

-- Step 1: Find all topics and their max days from CSV (manual check needed)
-- For now, let's fix Excel Tips specifically to have max 30 days

DO $$
DECLARE
  excel_tips_topic_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get Excel Tips topic
  SELECT id INTO excel_tips_topic_id
  FROM public.topics
  WHERE name = 'Excel Tips & Tricks'
  LIMIT 1;

  IF excel_tips_topic_id IS NULL THEN
    RAISE NOTICE 'Excel Tips & Tricks topic not found - skipping';
  ELSE
    -- Delete all quizzes beyond day 30 for Excel Tips
    DELETE FROM public.quizzes
    WHERE topic_id = excel_tips_topic_id
      AND day_number > 30;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % Excel Tips quizzes beyond day 30', deleted_count;

    -- Update user_topics that are beyond day 30
    UPDATE public.user_topics
    SET current_day = LEAST(current_day, 30),
        unlock_day = LEAST(unlock_day, 30),
        completed_days = LEAST(completed_days, 30)
    WHERE topic_id = excel_tips_topic_id
      AND (current_day > 30 OR unlock_day > 30 OR completed_days > 30);

    RAISE NOTICE 'Updated user_topics for Excel Tips to max day 30';
  END IF;
END $$;

-- Show summary of all topics and their day counts
SELECT 
  t.name as topic_name,
  COUNT(DISTINCT q.day_number) as days_in_database,
  MIN(q.day_number) as min_day,
  MAX(q.day_number) as max_day
FROM public.topics t
LEFT JOIN public.quizzes q ON t.id = q.topic_id
GROUP BY t.name
ORDER BY t.name;

