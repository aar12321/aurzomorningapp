-- Create Day 1 quizzes for the original 13 topics (the ones users can select)
-- This ensures quizzes exist for the topics Rohan and other users have selected

INSERT INTO public.quizzes (topic_id, day_number)
SELECT id, 1 
FROM public.topics 
WHERE name IN ('Geometry', 'Calculus', 'Algebra', 'English', 'SAT/ACT Practice', 'Chemistry', 'Biology', 'General Science', 'Financial Literacy', 'Business', 'General Knowledge', 'World Events', 'AI & Tech')
ON CONFLICT (topic_id, day_number) DO NOTHING;

-- Now add sample questions for each of these quizzes
-- Geometry Day 1 Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the sum of interior angles in a triangle?',
  '90 degrees',
  '180 degrees',
  '270 degrees',
  '360 degrees',
  'B',
  'The sum of interior angles in any triangle is always 180 degrees, regardless of the triangle type.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the formula for the area of a circle?',
  'πr²',
  '2πr',
  'πd',
  'πr²h',
  'A',
  'The area of a circle is calculated using the formula A = πr², where r is the radius.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'How many sides does a hexagon have?',
  '5',
  '6',
  '7',
  '8',
  'B',
  'A hexagon is a polygon with exactly 6 sides and 6 angles.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the Pythagorean theorem?',
  'a² + b² = c²',
  'a + b = c',
  'a × b = c',
  'a - b = c',
  'A',
  'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the perimeter of a square with side length 5?',
  '10',
  '15',
  '20',
  '25',
  'C',
  'The perimeter of a square is 4 times the side length. For a square with side 5, the perimeter is 4 × 5 = 20.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

-- Add a few more for other key topics (Calculus, Financial Literacy, Business, General Knowledge)
-- I'll add 2-3 questions each to make sure there are quizzes available

-- Financial Literacy Day 1 Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the recommended percentage of income to save?',
  '5-10%',
  '10-20%',
  '20-30%',
  '30-40%',
  'B',
  'Financial experts recommend saving at least 10-20% of your income for financial security.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is an emergency fund?',
  'A savings account for vacations',
  'A fund for unexpected expenses',
  'An investment account',
  'A checking account',
  'B',
  'An emergency fund is money set aside to cover unexpected expenses or financial emergencies.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

-- Business Day 1 Questions  
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is a SWOT analysis?',
  'A type of business plan',
  'Analysis of Strengths, Weaknesses, Opportunities, Threats',
  'A financial statement',
  'A marketing strategy',
  'B',
  'SWOT analysis evaluates Strengths, Weaknesses, Opportunities, and Threats to make strategic decisions.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Business' AND q.day_number = 1;

-- General Knowledge Day 1 Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the capital of France?',
  'London',
  'Berlin',
  'Paris',
  'Madrid',
  'C',
  'Paris is the capital and largest city of France.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Knowledge' AND q.day_number = 1;

