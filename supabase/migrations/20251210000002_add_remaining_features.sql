-- Comprehensive migration for all remaining features

-- ============================================
-- ROUTINES & HABITS
-- ============================================

-- User routines table
CREATE TABLE IF NOT EXISTS public.user_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration INTEGER DEFAULT 0, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Routine templates
CREATE TABLE IF NOT EXISTS public.routine_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT,
  estimated_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Routine completions
CREATE TABLE IF NOT EXISTS public.routine_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.user_routines(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  steps_completed JSONB
);

-- Habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  target_frequency TEXT DEFAULT 'daily', -- daily, weekly, custom
  reminder_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habit completions
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- ============================================
-- JOURNALING
-- ============================================

-- Journal entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('daily', 'gratitude', 'goal', 'mood')),
  content TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  gratitude_items JSONB,
  goal_reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- MEDITATION
-- ============================================

-- Meditation sessions
CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meditation_type TEXT NOT NULL CHECK (meditation_type IN ('guided', 'breathing', 'mindfulness')),
  duration_minutes INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Meditation library
CREATE TABLE IF NOT EXISTS public.meditation_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  audio_url TEXT,
  meditation_type TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TOURNAMENTS
-- ============================================

-- Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('weekly', 'monthly', 'special')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- ============================================
-- REWARD SHOP
-- ============================================

-- Shop items
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('theme', 'avatar', 'powerup', 'badge', 'content')),
  xp_cost INTEGER NOT NULL,
  image_url TEXT,
  is_limited BOOLEAN DEFAULT false,
  available_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User purchases
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  xp_spent INTEGER NOT NULL
);

-- ============================================
-- ANALYTICS & INSIGHTS
-- ============================================

-- User insights (cached AI insights)
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- User routines
CREATE POLICY "Users can manage their own routines"
  ON public.user_routines FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view their routine completions"
  ON public.routine_completions FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Habits
CREATE POLICY "Users can manage their own habits"
  ON public.habits FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view their habit completions"
  ON public.habit_completions FOR ALL
  USING (habit_id IN (SELECT id FROM public.habits WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

-- Journal entries
CREATE POLICY "Users can manage their own journal entries"
  ON public.journal_entries FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Meditation sessions
CREATE POLICY "Users can manage their own meditation sessions"
  ON public.meditation_sessions FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Tournaments (public read, authenticated write)
CREATE POLICY "Anyone can view active tournaments"
  ON public.tournaments FOR SELECT
  USING (true);

CREATE POLICY "Users can join tournaments"
  ON public.tournament_participants FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view their tournament participation"
  ON public.tournament_participants FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Shop items (public read)
CREATE POLICY "Anyone can view shop items"
  ON public.shop_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can purchase items"
  ON public.user_purchases FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view their purchases"
  ON public.user_purchases FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- User insights
CREATE POLICY "Users can view their own insights"
  ON public.user_insights FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_routines_user ON public.user_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_user ON public.routine_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON public.journal_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user ON public.meditation_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON public.tournament_participants(tournament_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_user ON public.user_insights(user_id, generated_at);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.user_routines IS 'User-created morning routines';
COMMENT ON TABLE public.habits IS 'User habits to track';
COMMENT ON TABLE public.journal_entries IS 'Journal entries for reflection';
COMMENT ON TABLE public.meditation_sessions IS 'Meditation session tracking';
COMMENT ON TABLE public.tournaments IS 'Weekly/monthly tournaments';
COMMENT ON TABLE public.shop_items IS 'Items available in the reward shop';
COMMENT ON TABLE public.user_insights IS 'AI-generated insights for users';

