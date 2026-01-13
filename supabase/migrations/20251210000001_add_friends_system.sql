-- Friends System
-- Allows users to add friends and view friend leaderboards

-- Friends table (bidirectional friendships)
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Personal records table for tracking best scores
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('wordle_streak', 'wordle_best', 'sudoku_best', 'sudoku_fastest', '2048_high', 'descramble_high', 'quiz_perfect_streak', 'quiz_highest_accuracy', 'longest_streak', 'most_xp_day')),
  value INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  UNIQUE(user_id, record_type)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends
CREATE POLICY "Users can view their own friend requests"
  ON public.friends FOR SELECT
  USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR friend_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can send friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update friend requests they received"
  ON public.friends FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can delete their own friendships"
  ON public.friends FOR DELETE
  USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR friend_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- RLS Policies for personal_records
CREATE POLICY "Users can view all personal records"
  ON public.personal_records FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own records"
  ON public.personal_records FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own records"
  ON public.personal_records FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_type ON public.personal_records(record_type);

-- Function to get friend leaderboard
CREATE OR REPLACE FUNCTION get_friends_leaderboard(current_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  total_xp INTEGER,
  streak_count INTEGER,
  rank_position BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH friend_ids AS (
    SELECT 
      CASE 
        WHEN f.user_id = current_user_id THEN f.friend_id 
        ELSE f.user_id 
      END as fid
    FROM public.friends f
    WHERE (f.user_id = current_user_id OR f.friend_id = current_user_id)
      AND f.status = 'accepted'
  ),
  all_users AS (
    SELECT current_user_id as uid
    UNION
    SELECT fid FROM friend_ids
  )
  SELECT 
    u.id as user_id,
    u.full_name,
    COALESCE(u.total_xp, 0) as total_xp,
    COALESCE(u.streak_count, 0) as streak_count,
    ROW_NUMBER() OVER (ORDER BY COALESCE(u.total_xp, 0) DESC) as rank_position
  FROM public.users u
  WHERE u.id IN (SELECT uid FROM all_users)
  ORDER BY total_xp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.friends IS 'Friend relationships between users';
COMMENT ON TABLE public.personal_records IS 'Personal best records for various activities';

