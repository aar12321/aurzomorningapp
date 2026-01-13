-- Fix duplicate topics by merging them into one
-- This script removes duplicate topics and consolidates user_topics and quizzes

-- Step 1: Find all duplicate topics by name
-- Geometry appears twice, we want to keep one and merge all references

DO $$
DECLARE
  geometry_old_ids UUID[];
  geometry_new_id UUID;
  topic_name TEXT;
BEGIN
  -- Get all geometry topic IDs (there should be 2)
  SELECT ARRAY_AGG(id ORDER BY created_at ASC) INTO geometry_old_ids
  FROM public.topics
  WHERE name = 'Geometry';

  -- Keep the oldest one (first in the array)
  geometry_new_id := geometry_old_ids[1];

  -- For each old geometry topic that's not the new one
  IF array_length(geometry_old_ids, 1) > 1 THEN
    -- Update user_topics to point to the new topic
    FOR i IN 2..array_length(geometry_old_ids, 1) LOOP
      UPDATE public.user_topics
      SET topic_id = geometry_new_id
      WHERE topic_id = geometry_old_ids[i]
        AND topic_id != geometry_new_id
        AND NOT EXISTS (
          SELECT 1 FROM public.user_topics ut2
          WHERE ut2.user_id = user_topics.user_id
            AND ut2.topic_id = geometry_new_id
        );

      -- Delete any duplicate user_topics that couldn't be merged
      DELETE FROM public.user_topics
      WHERE topic_id = geometry_old_ids[i];

      -- Update quizzes to point to the new topic
      UPDATE public.quizzes
      SET topic_id = geometry_new_id
      WHERE topic_id = geometry_old_ids[i];

      -- Now safe to delete the old topic
      DELETE FROM public.topics
      WHERE id = geometry_old_ids[i];
    END LOOP;
  END IF;

  -- Also check for any other duplicates (Algebra, Calculus, etc.)
  FOR topic_name IN SELECT DISTINCT name FROM public.topics GROUP BY name HAVING COUNT(*) > 1 LOOP
    DECLARE
      topic_ids UUID[];
      keeper_id UUID;
      i INT;
    BEGIN
      -- Get all IDs for this topic name
      SELECT ARRAY_AGG(id ORDER BY created_at ASC) INTO topic_ids
      FROM public.topics
      WHERE name = topic_name;

      -- Keep the first one
      keeper_id := topic_ids[1];

      -- Merge the others
      FOR i IN 2..array_length(topic_ids, 1) LOOP
        -- Update user_topics
        UPDATE public.user_topics
        SET topic_id = keeper_id
        WHERE topic_id = topic_ids[i]
          AND topic_id != keeper_id
          AND NOT EXISTS (
            SELECT 1 FROM public.user_topics ut2
            WHERE ut2.user_id = user_topics.user_id
              AND ut2.topic_id = keeper_id
          );

        -- Delete duplicate user_topics
        DELETE FROM public.user_topics
        WHERE topic_id = topic_ids[i];

        -- Update quizzes
        UPDATE public.quizzes
        SET topic_id = keeper_id
        WHERE topic_id = topic_ids[i];

        -- Delete the duplicate topic
        DELETE FROM public.topics
        WHERE id = topic_ids[i];
      END LOOP;
    END;
  END LOOP;
END $$;

-- Verify the results
SELECT name, COUNT(*) as count
FROM public.topics
GROUP BY name
HAVING COUNT(*) > 1;

