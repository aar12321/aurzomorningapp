-- Fix duplicate user_topics entries
-- When a user has multiple entries for the same topic name, keep only the one with the highest progress

DO $$
DECLARE
  user_record RECORD;
  topic_name TEXT;
  duplicate_topics UUID[];
  keeper_id UUID;
  max_day INT;
BEGIN
  -- For each user, find duplicate topics by name
  FOR user_record IN SELECT DISTINCT user_id FROM public.user_topics LOOP
    -- Find topics with duplicate names for this user
    FOR topic_name IN 
      SELECT DISTINCT t.name
      FROM public.user_topics ut
      JOIN public.topics t ON ut.topic_id = t.id
      WHERE ut.user_id = user_record.user_id
      GROUP BY t.name
      HAVING COUNT(*) > 1
    LOOP
      -- Get all user_topic IDs for this topic name for this user
      WITH topic_progress AS (
        SELECT ut.id, t.name, ut.current_day, ut.completed_days,
               ROW_NUMBER() OVER (ORDER BY ut.current_day DESC, ut.completed_days DESC) as rn
        FROM public.user_topics ut
        JOIN public.topics t ON ut.topic_id = t.id
        WHERE ut.user_id = user_record.user_id AND t.name = topic_name
      )
      SELECT ARRAY_AGG(id ORDER BY current_day DESC, completed_days DESC) INTO duplicate_topics
      FROM topic_progress;
      
      -- Keep the first one (highest progress)
      IF duplicate_topics IS NOT NULL AND array_length(duplicate_topics, 1) > 1 THEN
        keeper_id := duplicate_topics[1];
        
        -- For each duplicate, merge quiz attempts and then delete
        FOR i IN 2..array_length(duplicate_topics, 1) LOOP
          DECLARE
            old_ut_id UUID := duplicate_topics[i];
            max_completed INT;
            max_current INT;
          BEGIN
            -- Get max values from both entries
            SELECT COALESCE(MAX(completed_days), 0) INTO max_completed
            FROM public.user_topics
            WHERE id IN (old_ut_id, keeper_id);
            
            SELECT COALESCE(MAX(current_day), 0) INTO max_current
            FROM public.user_topics
            WHERE id IN (old_ut_id, keeper_id);
            
            -- Update the keeper to have the max progress
            UPDATE public.user_topics
            SET completed_days = max_completed,
                current_day = max_current
            WHERE id = keeper_id;
            
            -- Now delete the duplicate
            DELETE FROM public.user_topics WHERE id = old_ut_id;
          END;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Show any remaining duplicates
SELECT 
  u.email,
  t.name as topic_name,
  COUNT(*) as duplicates
FROM public.user_topics ut
JOIN public.users u ON ut.user_id = u.id
JOIN public.topics t ON ut.topic_id = t.id
GROUP BY u.email, t.name
HAVING COUNT(*) > 1;

