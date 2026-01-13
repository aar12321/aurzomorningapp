-- Create topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table with profile info
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'America/New_York',
  streak_count INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_quiz_date DATE
);

-- Create user_topics for user's selected topics
CREATE TABLE public.user_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  completed_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, day_number)
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answers JSONB NOT NULL
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics (public read)
CREATE POLICY "Topics are viewable by everyone" 
ON public.topics FOR SELECT 
USING (true);

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = auth_id);

-- RLS Policies for user_topics
CREATE POLICY "Users can view their own topics" 
ON public.user_topics FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own topics" 
ON public.user_topics FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own topics" 
ON public.user_topics FOR UPDATE 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- RLS Policies for quizzes (public read)
CREATE POLICY "Quizzes are viewable by everyone" 
ON public.quizzes FOR SELECT 
USING (true);

-- RLS Policies for questions (public read)
CREATE POLICY "Questions are viewable by everyone" 
ON public.questions FOR SELECT 
USING (true);

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- RLS Policies for badges (public read)
CREATE POLICY "Badges are viewable by everyone" 
ON public.badges FOR SELECT 
USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" 
ON public.user_badges FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own badges" 
ON public.user_badges FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Insert initial topics
INSERT INTO public.topics (name, category, description) VALUES
('Geometry', 'Math', 'Master shapes, angles, and spatial reasoning'),
('Calculus', 'Math', 'Explore limits, derivatives, and integrals'),
('Algebra', 'Math', 'Build foundation in equations and functions'),
('English', 'Language', 'Enhance reading, grammar, and vocabulary'),
('SAT/ACT Practice', 'Test Prep', 'Prepare for college entrance exams'),
('Chemistry', 'Science', 'Discover elements, reactions, and compounds'),
('Biology', 'Science', 'Learn about life, cells, and ecosystems'),
('General Science', 'Science', 'Explore fundamental scientific concepts'),
('Financial Literacy', 'Life Skills', 'Master banking, investing, and budgeting'),
('Business', 'Professional', 'Learn strategy, law, and entrepreneurship'),
('General Knowledge', 'Trivia', 'Expand your mind with fun facts'),
('World Events', 'Current Affairs', 'Stay informed on global trends'),
('AI & Tech', 'Technology', 'Understand AI terminology and trends');

-- Insert initial badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
('Learner''s Spark', 'Complete your first quiz', '✨', 'quizzes_completed', 1),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 7),
('Knowledge Keeper', 'Earn 100 XP', '🎯', 'total_xp', 100),
('Perfect Score', 'Get 5/5 on any quiz', '💯', 'perfect_quiz', 1),
('Scholar Supreme', 'Maintain a 30-day streak', '👑', 'streak', 30);

-- Create indexes for performance
CREATE INDEX idx_user_topics_user_id ON public.user_topics(user_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_quizzes_topic_day ON public.quizzes(topic_id, day_number);