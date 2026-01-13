-- Create daily_flashcards table for caching AI-generated content
CREATE TABLE IF NOT EXISTS public.daily_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_type TEXT NOT NULL, -- 'daily_learn', 'life', 'work_money', 'world_society', 'self_growth', 'cooking'
  topic_name TEXT, -- Specific topic name for library topics (e.g., 'Decision Making', 'Habits'). NULL for daily_learn and cooking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  flashcards JSONB NOT NULL, -- Array of flashcard objects: [{front: string, back: string, order: number}]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index that properly handles NULL values
-- This ensures one generation per day per topic for all users
CREATE UNIQUE INDEX IF NOT EXISTS daily_flashcards_unique_idx 
ON public.daily_flashcards(topic_type, date, COALESCE(topic_name, ''));

-- Create user_goals table for daily goals
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create daily_quotes table for inspirational quotes
CREATE TABLE IF NOT EXISTS public.daily_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text TEXT NOT NULL,
  author TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_flashcards (public read, authenticated users can insert)
CREATE POLICY "Daily flashcards are viewable by everyone" 
ON public.daily_flashcards FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert daily flashcards" 
ON public.daily_flashcards FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals" 
ON public.user_goals FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own goals" 
ON public.user_goals FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own goals" 
ON public.user_goals FOR UPDATE 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- RLS Policies for daily_quotes (public read)
CREATE POLICY "Daily quotes are viewable by everyone" 
ON public.daily_quotes FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_flashcards_topic_date ON public.daily_flashcards(topic_type, date);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_date ON public.user_goals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_quotes_date ON public.daily_quotes(date);

