-- Performance Indexes for Daily Quiz App
-- These indexes optimize query performance for common operations

-- Indexes for quiz_attempts table
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_completed ON public.quiz_attempts(user_id, completed_at);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_last_quiz_date ON public.users(last_quiz_date);
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON public.users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_streak_count ON public.users(streak_count DESC);

-- Indexes for user_topics table
CREATE INDEX IF NOT EXISTS idx_user_topics_user_id ON public.user_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topics_topic_id ON public.user_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topics_user_topic ON public.user_topics(user_id, topic_id);

-- Indexes for user_badges table
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at);

-- Indexes for questions table
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(quiz_id, order_number);

-- Indexes for quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_topic_day ON public.quizzes(topic_id, day_number);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic_id ON public.quizzes(topic_id);

-- Indexes for topics table
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_name ON public.topics(name);

-- Indexes for badges table
CREATE INDEX IF NOT EXISTS idx_badges_requirement_type ON public.badges(requirement_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_date ON public.quiz_attempts(user_id, DATE(completed_at));
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON public.quiz_attempts(quiz_id, user_id);
CREATE INDEX IF NOT EXISTS idx_users_xp_streak ON public.users(total_xp DESC, streak_count DESC);

-- Partial indexes for active users (users with quiz attempts)
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(id) 
WHERE total_xp > 0;

-- Partial indexes for recent quiz attempts (last 30 days)
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_recent ON public.quiz_attempts(user_id, completed_at)
WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days';

-- Index for leaderboard queries (users with XP > 0, ordered by XP and streak)
CREATE INDEX IF NOT EXISTS idx_users_leaderboard ON public.users(total_xp DESC, streak_count DESC, id)
WHERE total_xp > 0;

-- Index for today's quiz completion status
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_today ON public.quiz_attempts(user_id, quiz_id, completed_at)
WHERE DATE(completed_at) = CURRENT_DATE;

-- Index for streak calculations
CREATE INDEX IF NOT EXISTS idx_users_streak_calc ON public.users(last_quiz_date, streak_count, id);

-- Add comments for documentation
COMMENT ON INDEX idx_quiz_attempts_user_id IS 'Optimizes queries filtering quiz attempts by user';
COMMENT ON INDEX idx_quiz_attempts_completed_at IS 'Optimizes queries filtering quiz attempts by completion date';
COMMENT ON INDEX idx_users_total_xp IS 'Optimizes leaderboard queries ordered by XP';
COMMENT ON INDEX idx_users_streak_count IS 'Optimizes leaderboard queries ordered by streak';
COMMENT ON INDEX idx_quiz_attempts_user_completed IS 'Optimizes queries for user quiz history with date filtering';
COMMENT ON INDEX idx_users_leaderboard IS 'Optimizes leaderboard queries for active users';
COMMENT ON INDEX idx_quiz_attempts_today IS 'Optimizes queries for today''s quiz completion status';
COMMENT ON INDEX idx_users_streak_calc IS 'Optimizes streak calculation queries';
