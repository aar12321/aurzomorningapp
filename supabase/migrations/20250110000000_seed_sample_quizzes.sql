-- Seed Day 1 quizzes for all 13 topics
-- Each topic gets 5 questions with educational content

-- Geometry Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Geometry';

-- Geometry Questions
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
  'a² - b² = c²',
  'a × b = c',
  'A',
  'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the volume of a cube with side length 3?',
  '9',
  '18',
  '27',
  '36',
  'C',
  'The volume of a cube is calculated as side³. So 3³ = 3 × 3 × 3 = 27 cubic units.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Geometry' AND q.day_number = 1;

-- Calculus Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Calculus';

-- Calculus Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the derivative of x²?',
  'x',
  '2x',
  'x²',
  '2x²',
  'B',
  'Using the power rule: d/dx(x²) = 2x. The power rule states that d/dx(xⁿ) = nxⁿ⁻¹.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Calculus' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the integral of 2x?',
  'x²',
  'x² + C',
  '2x²',
  '2x² + C',
  'B',
  'The integral of 2x is x² + C, where C is the constant of integration.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Calculus' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What does a limit represent?',
  'The exact value',
  'The value a function approaches',
  'The maximum value',
  'The minimum value',
  'B',
  'A limit represents the value that a function approaches as the input approaches a certain value.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Calculus' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the derivative of a constant?',
  'The constant itself',
  '0',
  '1',
  'Undefined',
  'B',
  'The derivative of any constant is 0, because constants do not change with respect to the variable.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Calculus' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the chain rule used for?',
  'Adding functions',
  'Differentiating composite functions',
  'Multiplying functions',
  'Dividing functions',
  'B',
  'The chain rule is used to find the derivative of composite functions: d/dx[f(g(x))] = f''(g(x)) × g''(x).',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Calculus' AND q.day_number = 1;

-- Algebra Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Algebra';

-- Algebra Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Solve for x: 2x + 5 = 13',
  'x = 3',
  'x = 4',
  'x = 5',
  'x = 6',
  'B',
  'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Algebra' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the slope of the line y = 3x + 2?',
  '2',
  '3',
  '5',
  '6',
  'B',
  'In the slope-intercept form y = mx + b, m is the slope. Here, m = 3.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Algebra' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Factor: x² - 4',
  '(x - 2)(x + 2)',
  '(x - 2)²',
  '(x + 2)²',
  'x(x - 4)',
  'A',
  'This is a difference of squares: x² - 4 = (x - 2)(x + 2).',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Algebra' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the y-intercept of y = 2x - 3?',
  '-3',
  '3',
  '2',
  '-2',
  'A',
  'In y = mx + b form, b is the y-intercept. Here, b = -3.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Algebra' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Solve: 3x - 7 = 2x + 1',
  'x = 6',
  'x = 8',
  'x = 4',
  'x = 2',
  'B',
  'Subtract 2x from both sides: x - 7 = 1, then add 7: x = 8.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Algebra' AND q.day_number = 1;

-- English Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'English';

-- English Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Which sentence is grammatically correct?',
  'She don''t like pizza.',
  'She doesn''t like pizza.',
  'She not like pizza.',
  'She no like pizza.',
  'B',
  'The correct form is "She doesn''t like pizza" using the auxiliary verb "does" with the negative "not".',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'English' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the plural of "child"?',
  'childs',
  'children',
  'childes',
  'child',
  'B',
  'The plural of "child" is "children" - an irregular plural form.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'English' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Which word is a synonym for "happy"?',
  'sad',
  'angry',
  'joyful',
  'tired',
  'C',
  '"Joyful" is a synonym for "happy" as both words express positive emotions.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'English' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What type of word is "quickly"?',
  'noun',
  'verb',
  'adjective',
  'adverb',
  'D',
  '"Quickly" is an adverb because it modifies a verb and typically ends in "-ly".',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'English' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Which sentence uses correct punctuation?',
  'I love apples, oranges, and bananas.',
  'I love apples, oranges and bananas.',
  'I love apples oranges and bananas.',
  'I love apples, oranges, bananas.',
  'A',
  'The Oxford comma (before "and") is correct in formal writing: "apples, oranges, and bananas."',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'English' AND q.day_number = 1;

-- SAT/ACT Practice Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'SAT/ACT Practice';

-- SAT/ACT Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'If 3x + 2y = 12 and x = 2, what is y?',
  '2',
  '3',
  '4',
  '6',
  'B',
  'Substitute x = 2: 3(2) + 2y = 12, so 6 + 2y = 12, therefore 2y = 6, so y = 3.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'SAT/ACT Practice' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the main idea of the passage? (Reading comprehension skill)',
  'Always choose the most general statement',
  'Look for the central theme that ties everything together',
  'Pick the first sentence',
  'Choose the longest answer',
  'B',
  'The main idea is the central theme that connects all supporting details in a passage.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'SAT/ACT Practice' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Which is the best way to approach SAT/ACT math problems?',
  'Skip all word problems',
  'Read carefully, identify what''s given, and work step-by-step',
  'Guess immediately',
  'Use a calculator for everything',
  'B',
  'The best approach is to read carefully, identify given information, and solve step-by-step.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'SAT/ACT Practice' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the most important time management strategy?',
  'Spend equal time on all questions',
  'Answer easy questions first, then tackle harder ones',
  'Skip every other question',
  'Use all your time on the first question',
  'B',
  'Answer easy questions first to secure points, then use remaining time for harder questions.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'SAT/ACT Practice' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What should you do if you''re unsure about an answer?',
  'Leave it blank',
  'Make an educated guess',
  'Ask the proctor',
  'Skip to the next section',
  'B',
  'On the SAT/ACT, there''s no penalty for wrong answers, so make an educated guess rather than leaving it blank.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'SAT/ACT Practice' AND q.day_number = 1;

-- Chemistry Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Chemistry';

-- Chemistry Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the chemical symbol for gold?',
  'Go',
  'Gd',
  'Au',
  'Ag',
  'C',
  'The chemical symbol for gold is Au, from the Latin word "aurum".',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Chemistry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the pH of pure water?',
  '6',
  '7',
  '8',
  '9',
  'B',
  'Pure water has a pH of 7, which is neutral on the pH scale.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Chemistry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'How many electrons does hydrogen have?',
  '0',
  '1',
  '2',
  '3',
  'B',
  'Hydrogen has 1 electron, which is equal to its atomic number.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Chemistry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What type of bond forms between sodium and chlorine?',
  'Covalent',
  'Ionic',
  'Metallic',
  'Hydrogen',
  'B',
  'Sodium and chlorine form an ionic bond, where sodium donates an electron to chlorine.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Chemistry' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the formula for table salt?',
  'NaCl',
  'NaCl₂',
  'Na₂Cl',
  'NaCl₃',
  'A',
  'Table salt is sodium chloride with the chemical formula NaCl.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Chemistry' AND q.day_number = 1;

-- Biology Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Biology';

-- Biology Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the powerhouse of the cell?',
  'Nucleus',
  'Mitochondria',
  'Ribosome',
  'Cell membrane',
  'B',
  'Mitochondria are called the powerhouse of the cell because they produce ATP, the cell''s energy currency.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Biology' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What process do plants use to make food?',
  'Respiration',
  'Photosynthesis',
  'Digestion',
  'Fermentation',
  'B',
  'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Biology' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the basic unit of heredity?',
  'Cell',
  'Gene',
  'Chromosome',
  'Protein',
  'B',
  'A gene is the basic unit of heredity that carries genetic information from parents to offspring.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Biology' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What type of blood cells fight infections?',
  'Red blood cells',
  'White blood cells',
  'Platelets',
  'Plasma',
  'B',
  'White blood cells (leukocytes) are responsible for fighting infections and foreign substances.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Biology' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the process by which cells divide?',
  'Respiration',
  'Mitosis',
  'Photosynthesis',
  'Osmosis',
  'B',
  'Mitosis is the process of cell division that results in two identical daughter cells.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Biology' AND q.day_number = 1;

-- General Science Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'General Science';

-- General Science Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the speed of light in a vacuum?',
  '300,000 km/s',
  '299,792,458 m/s',
  '186,000 miles/s',
  'All of the above',
  'D',
  'The speed of light is approximately 300,000 km/s, 299,792,458 m/s, or 186,000 miles/s - all are correct!',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Science' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the most abundant gas in Earth''s atmosphere?',
  'Oxygen',
  'Carbon dioxide',
  'Nitrogen',
  'Argon',
  'C',
  'Nitrogen makes up about 78% of Earth''s atmosphere, making it the most abundant gas.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Science' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the smallest unit of matter?',
  'Molecule',
  'Atom',
  'Cell',
  'Electron',
  'B',
  'An atom is the smallest unit of matter that retains the properties of an element.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Science' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What force keeps planets in orbit around the sun?',
  'Magnetism',
  'Gravity',
  'Friction',
  'Electricity',
  'B',
  'Gravity is the force that keeps planets in their orbits around the sun.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Science' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the chemical formula for water?',
  'H₂O',
  'H₂O₂',
  'CO₂',
  'NaCl',
  'A',
  'Water has the chemical formula H₂O, meaning two hydrogen atoms bonded to one oxygen atom.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Science' AND q.day_number = 1;

-- Financial Literacy Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Financial Literacy';

-- Financial Literacy Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the 50/30/20 rule?',
  '50% needs, 30% wants, 20% savings',
  '50% savings, 30% needs, 20% wants',
  '50% wants, 30% savings, 20% needs',
  '50% income, 30% expenses, 20% taxes',
  'A',
  'The 50/30/20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings and debt repayment.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is compound interest?',
  'Interest on the principal only',
  'Interest on principal plus previously earned interest',
  'Simple interest rate',
  'Fixed interest rate',
  'B',
  'Compound interest is interest calculated on the initial principal plus accumulated interest from previous periods.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is an emergency fund?',
  'Money for vacations',
  'Money set aside for unexpected expenses',
  'Investment money',
  'Retirement savings',
  'B',
  'An emergency fund is money set aside to cover unexpected expenses like job loss or medical bills.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the difference between a credit card and debit card?',
  'No difference',
  'Credit card uses borrowed money, debit uses your money',
  'Debit card has higher fees',
  'Credit card is always better',
  'B',
  'A credit card allows you to borrow money (with interest), while a debit card uses money from your checking account.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is diversification in investing?',
  'Putting all money in one stock',
  'Spreading investments across different assets',
  'Only investing in bonds',
  'Avoiding all investments',
  'B',
  'Diversification means spreading your investments across different assets to reduce risk.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Financial Literacy' AND q.day_number = 1;

-- Business Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'Business';

-- Business Questions
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

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the difference between revenue and profit?',
  'No difference',
  'Revenue is total income, profit is revenue minus expenses',
  'Profit is always higher',
  'Revenue is always higher',
  'B',
  'Revenue is total income from sales, while profit is revenue minus all expenses and costs.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Business' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is a startup?',
  'A large corporation',
  'A newly established business with high growth potential',
  'A government agency',
  'A non-profit organization',
  'B',
  'A startup is a newly established business, typically with innovative ideas and high growth potential.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Business' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is market research?',
  'Selling products',
  'Gathering information about customers and market conditions',
  'Hiring employees',
  'Setting prices',
  'B',
  'Market research involves gathering and analyzing information about customers, competitors, and market conditions.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Business' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is a business model?',
  'A building design',
  'A plan for how a business creates, delivers, and captures value',
  'A legal document',
  'A marketing campaign',
  'B',
  'A business model describes how a company creates, delivers, and captures value for its customers.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'Business' AND q.day_number = 1;

-- General Knowledge Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'General Knowledge';

-- General Knowledge Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the capital of Australia?',
  'Sydney',
  'Melbourne',
  'Canberra',
  'Perth',
  'C',
  'Canberra is the capital city of Australia, located in the Australian Capital Territory.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Knowledge' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'Who painted the Mona Lisa?',
  'Vincent van Gogh',
  'Pablo Picasso',
  'Leonardo da Vinci',
  'Michelangelo',
  'C',
  'Leonardo da Vinci painted the Mona Lisa, one of the most famous paintings in the world.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Knowledge' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the largest planet in our solar system?',
  'Earth',
  'Saturn',
  'Jupiter',
  'Neptune',
  'C',
  'Jupiter is the largest planet in our solar system, with a mass greater than all other planets combined.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Knowledge' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What year did World War II end?',
  '1944',
  '1945',
  '1946',
  '1947',
  'B',
  'World War II ended in 1945, with Japan''s surrender on September 2, 1945.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Knowledge' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the smallest country in the world?',
  'Monaco',
  'Vatican City',
  'Liechtenstein',
  'San Marino',
  'B',
  'Vatican City is the smallest country in the world by both area and population.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'General Knowledge' AND q.day_number = 1;

-- World Events Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'World Events';

-- World Events Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the main purpose of the United Nations?',
  'Military alliance',
  'Promote international cooperation and peace',
  'Economic trade organization',
  'Cultural exchange program',
  'B',
  'The UN''s main purpose is to promote international cooperation, maintain peace, and foster development.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'World Events' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is globalization?',
  'Isolation of countries',
  'The process of international integration',
  'Local trade only',
  'Cultural separation',
  'B',
  'Globalization is the process of international integration through trade, technology, and cultural exchange.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'World Events' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is climate change?',
  'Natural weather patterns',
  'Long-term changes in global temperatures and weather patterns',
  'Seasonal variations',
  'Local weather events',
  'B',
  'Climate change refers to long-term shifts in global temperatures and weather patterns, largely due to human activities.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'World Events' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the purpose of the World Health Organization (WHO)?',
  'Military defense',
  'Promote global health and coordinate international health responses',
  'Economic development',
  'Cultural preservation',
  'B',
  'WHO works to promote global health, coordinate international health responses, and set health standards.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'World Events' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is sustainable development?',
  'Rapid economic growth',
  'Development that meets present needs without compromising future generations',
  'Industrial expansion',
  'Resource depletion',
  'B',
  'Sustainable development meets current needs without compromising the ability of future generations to meet their own needs.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'World Events' AND q.day_number = 1;

-- AI & Tech Day 1 Quiz
INSERT INTO public.quizzes (topic_id, day_number) 
SELECT id, 1 FROM public.topics WHERE name = 'AI & Tech';

-- AI & Tech Questions
INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What does AI stand for?',
  'Automated Intelligence',
  'Artificial Intelligence',
  'Advanced Integration',
  'Automated Integration',
  'B',
  'AI stands for Artificial Intelligence - the simulation of human intelligence in machines.',
  1
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'AI & Tech' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is machine learning?',
  'Manual data entry',
  'A subset of AI that enables computers to learn without explicit programming',
  'Traditional programming',
  'Data storage only',
  'B',
  'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed.',
  2
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'AI & Tech' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is the cloud in technology?',
  'Weather phenomenon',
  'Remote servers that store and process data over the internet',
  'Physical storage devices',
  'Local computer networks',
  'B',
  'The cloud refers to remote servers that store and process data over the internet, rather than on local devices.',
  3
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'AI & Tech' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is blockchain?',
  'A type of database',
  'A distributed ledger technology that maintains a continuously growing list of records',
  'A programming language',
  'A hardware device',
  'B',
  'Blockchain is a distributed ledger technology that maintains a continuously growing list of records secured using cryptography.',
  4
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'AI & Tech' AND q.day_number = 1;

INSERT INTO public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_number)
SELECT 
  q.id,
  'What is cybersecurity?',
  'Physical security',
  'Protection of computer systems and networks from digital attacks',
  'Data backup only',
  'Software installation',
  'B',
  'Cybersecurity is the practice of protecting computer systems, networks, and data from digital attacks and unauthorized access.',
  5
FROM public.quizzes q 
JOIN public.topics t ON q.topic_id = t.id 
WHERE t.name = 'AI & Tech' AND q.day_number = 1;
