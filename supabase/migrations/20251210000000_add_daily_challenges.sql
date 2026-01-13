-- Daily Challenges System
-- Adds tables for daily and weekly challenges with progress tracking

-- Daily challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('quiz', 'streak', 'game', 'xp', 'perfect', 'time')),
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  icon TEXT NOT NULL DEFAULT '🎯',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User daily challenge progress
CREATE TABLE IF NOT EXISTS public.user_daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, date)
);

-- Weekly challenges table
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('quiz', 'streak', 'game', 'xp', 'perfect', 'time', 'consistency')),
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  icon TEXT NOT NULL DEFAULT '🏆',
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User weekly challenge progress
CREATE TABLE IF NOT EXISTS public.user_weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_challenges (public read)
CREATE POLICY "Anyone can view daily challenges"
  ON public.daily_challenges FOR SELECT
  USING (true);

-- RLS Policies for user_daily_challenges
CREATE POLICY "Users can view their own daily challenge progress"
  ON public.user_daily_challenges FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own daily challenge progress"
  ON public.user_daily_challenges FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own daily challenge progress"
  ON public.user_daily_challenges FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- RLS Policies for weekly_challenges (public read)
CREATE POLICY "Anyone can view weekly challenges"
  ON public.weekly_challenges FOR SELECT
  USING (true);

-- RLS Policies for user_weekly_challenges
CREATE POLICY "Users can view their own weekly challenge progress"
  ON public.user_weekly_challenges FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own weekly challenge progress"
  ON public.user_weekly_challenges FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own weekly challenge progress"
  ON public.user_weekly_challenges FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_user_date ON public.user_daily_challenges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_weekly_challenges_user ON public.user_weekly_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON public.daily_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates ON public.weekly_challenges(week_start, week_end);

-- Seed some default daily challenges
INSERT INTO public.daily_challenges (title, description, challenge_type, target_value, xp_reward, icon) VALUES
  ('Quiz Champion', 'Complete 2 quizzes today', 'quiz', 2, 50, '📚'),
  ('Perfect Score', 'Get 100% on any quiz', 'perfect', 1, 75, '💯'),
  ('Game Master', 'Play 3 games today', 'game', 3, 50, '🎮'),
  ('XP Hunter', 'Earn 100 XP today', 'xp', 100, 50, '⚡'),
  ('Early Bird', 'Complete any activity before 9 AM', 'time', 1, 60, '🌅'),
  ('Streak Keeper', 'Maintain your streak', 'streak', 1, 40, '🔥'),
  ('Knowledge Seeker', 'Complete 3 flashcard sessions', 'quiz', 3, 60, '🧠'),
  ('Word Wizard', 'Win a Wordle game', 'game', 1, 50, '🔤'),
  ('Number Master', 'Complete a Sudoku puzzle', 'game', 1, 50, '🔢'),
  ('High Scorer', 'Score 500+ in 2048', 'game', 500, 75, '🏆')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE public.daily_challenges IS 'Available daily challenges that reset each day';
COMMENT ON TABLE public.user_daily_challenges IS 'User progress on daily challenges';
COMMENT ON TABLE public.weekly_challenges IS 'Weekly challenges with longer timeframes';
COMMENT ON TABLE public.user_weekly_challenges IS 'User progress on weekly challenges';

