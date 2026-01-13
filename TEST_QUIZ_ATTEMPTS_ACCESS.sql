-- Test if quiz_attempts SELECT is working
-- Run this to verify you can read your own attempts

-- This should work if RLS is correct
SELECT 
  qa.id,
  qa.completed_at,
  q.quiz_id,
  q.topic_id
FROM quiz_attempts qa
LEFT JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.user_id IN (
  SELECT id FROM users WHERE auth_id = auth.uid()
)
ORDER BY qa.completed_at DESC
LIMIT 5;

-- If the above works, the SELECT policy is correct!
-- If it gives 403, we need to fix the policy


