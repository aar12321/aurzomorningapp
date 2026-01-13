-- FIX EXISTING USER'S TOPICS
-- This will check what Rohan has and fix it

-- First, check the current state
SELECT 
  ut.id,
  ut.topic_id,
  ut.current_day,
  t.name as topic_name,
  t.category
FROM public.user_topics ut
LEFT JOIN public.topics t ON ut.topic_id = t.id
WHERE ut.user_id = (
  SELECT id FROM public.users WHERE email = 'rohanchax@gmail.com'
);

-- If topics are NULL or wrong, delete them first
DELETE FROM public.user_topics 
WHERE user_id = (
  SELECT id FROM public.users WHERE email = 'rohanchax@gmail.com'
);

-- Now manually add some sample topics for Rohan (5 topics max)
INSERT INTO public.user_topics (user_id, topic_id, current_day, completed_days)
SELECT 
  u.id,
  t.id,
  1,
  0
FROM public.users u
CROSS JOIN public.topics t
WHERE u.email = 'rohanchax@gmail.com'
  AND t.name IN ('Geometry', 'Calculus', 'Business', 'Financial Literacy', 'General Knowledge');

-- Verify it worked
SELECT 
  ut.id,
  ut.topic_id,
  ut.current_day,
  t.name as topic_name,
  t.category
FROM public.user_topics ut
LEFT JOIN public.topics t ON ut.topic_id = t.id
WHERE ut.user_id = (
  SELECT id FROM public.users WHERE email = 'rohanchax@gmail.com'
);

