-- Add location fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lon DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_admin1 TEXT,
ADD COLUMN IF NOT EXISTS location_country TEXT;

-- Create game_scores table
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL, -- 'wordle', '2048', 'sudoku', 'descramble'
    score INTEGER NOT NULL,
    metadata JSONB, -- For extra details like time taken, moves, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for game_scores
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own scores
-- Note: We join with users table to verify auth_id matches the authenticated user
CREATE POLICY "Users can view their own game scores"
    ON public.game_scores FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM public.users WHERE id = game_scores.user_id
        )
    );

-- Policy to allow users to insert their own scores
CREATE POLICY "Users can insert their own game scores"
    ON public.game_scores FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth_id FROM public.users WHERE id = game_scores.user_id
        )
    );

-- Index for leaderboard/stats
CREATE INDEX IF NOT EXISTS idx_game_scores_user_game ON public.game_scores(user_id, game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_score ON public.game_scores(game_type, score DESC);
