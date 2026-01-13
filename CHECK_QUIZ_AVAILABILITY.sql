-- Check which topics have quizzes for Day 1
-- Run this in Supabase SQL Editor to see what's available

SELECT 
  t.id as topic_id,
  t.name as topic_name,
  t.category,
  COUNT(q.id) as quiz_count,
  MIN(q.day_number) as first_day,
  MAX(q.day_number) as last_day
FROM topics t
LEFT JOIN quizzes q ON t.id = q.topic_id AND q.day_number = 1
GROUP BY t.id, t.name, t.category
ORDER BY t.category, t.name;

-- Also check your user topics
SELECT 
  ut.id,
  ut.topic_id,
  ut.current_day,
  t.name as topic_name,
  t.category,
  EXISTS (
    SELECT 1 FROM quizzes q 
    WHERE q.topic_id = ut.topic_id 
    AND q.day_number = ut.current_day
  ) as quiz_exists
FROM user_topics ut
JOIN topics t ON ut.topic_id = t.id
WHERE ut.user_id IN (
  SELECT id FROM users WHERE email = 'rohanchax@gmail.com'
)
ORDER BY t.name;


