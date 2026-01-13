-- Check what quizzes exist for Day 1
SELECT 
  q.id as quiz_id,
  t.name as topic_name,
  t.id as topic_id,
  q.day_number,
  COUNT(qst.id) as question_count
FROM public.quizzes q
JOIN public.topics t ON q.topic_id = t.id
LEFT JOIN public.questions qst ON qst.quiz_id = q.id
WHERE q.day_number = 1
GROUP BY q.id, t.name, t.id, q.day_number
ORDER BY t.name;

