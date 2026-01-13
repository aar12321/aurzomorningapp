-- Fix any user_topics that point to non-existent quizzes
-- This will automatically cap users at the max available day for each topic

DO $$
DECLARE
  user_topic_record RECORD;
  max_day INTEGER;
  fixed_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  -- Loop through all user_topics
  FOR user_topic_record IN 
    SELECT ut.id, ut.user_id, ut.topic_id, ut.current_day, ut.unlock_day, ut.completed_days, t.name as topic_name
    FROM public.user_topics ut
    JOIN public.topics t ON ut.topic_id = t.id
  LOOP
    -- Check if quiz exists for current_day
    IF NOT EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.topic_id = user_topic_record.topic_id
        AND q.day_number = user_topic_record.current_day
    ) THEN
      -- Quiz doesn't exist - find max day that does exist
      SELECT COALESCE(MAX(day_number), 0) INTO max_day
      FROM public.quizzes
      WHERE topic_id = user_topic_record.topic_id;
      
      IF max_day > 0 THEN
        -- Update to max available day
        UPDATE public.user_topics
        SET 
          current_day = max_day,
          unlock_day = LEAST(unlock_day, max_day),
          completed_days = LEAST(completed_days, max_day - 1)
        WHERE id = user_topic_record.id;
        
        fixed_count := fixed_count + 1;
        RAISE NOTICE 'Fixed % (Day % -> Day %)', user_topic_record.topic_name, user_topic_record.current_day, max_day;
      ELSE
        -- No quizzes exist - delete the topic
        DELETE FROM public.user_topics
        WHERE id = user_topic_record.id;
        
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'Deleted % (no quizzes exist)', user_topic_record.topic_name;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Fixed % user_topics, deleted % topics with no quizzes', fixed_count, deleted_count;
END $$;

-- Verify: Show any remaining issues
SELECT 
  ut.id,
  t.name as topic_name,
  ut.current_day,
  ut.unlock_day,
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.topic_id = ut.topic_id
      AND q.day_number = ut.current_day
  ) as quiz_exists,
  (SELECT MAX(day_number) FROM public.quizzes WHERE topic_id = ut.topic_id) as max_available_day
FROM public.user_topics ut
JOIN public.topics t ON ut.topic_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.quizzes q
  WHERE q.topic_id = ut.topic_id
    AND q.day_number = ut.current_day
)
ORDER BY t.name;

