-- ============================================================================
-- CONSOLIDATED MIGRATION SCRIPT
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- Migration 1: Add location fields and game_scores table
-- ============================================================================

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

-- ============================================================================
-- Migration 2: Create user_preferences table
-- ============================================================================

-- Create user_preferences table
create table if not exists public.user_preferences (
    user_id uuid references auth.users not null primary key,
    theme text check (theme in ('sunrise', 'sunset')) default 'sunrise',
    location jsonb default '{}'::jsonb,
    phone_number text,
    notifications_enabled boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_preferences enable row level security;

-- Create policies
create policy "Users can view their own preferences"
    on public.user_preferences for select
    using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
    on public.user_preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on public.user_preferences for update
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
    before update on public.user_preferences
    for each row
    execute procedure public.handle_updated_at();

-- ============================================================================
-- Migration 3: Consolidate preferences (add columns and migrate data)
-- ============================================================================

-- Add new columns to user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"notification_method": ["email"], "notification_preferences": {"include_news": false, "include_quotes": false, "include_challenge": false, "news_categories": ["general"]}}'::jsonb,
ADD COLUMN IF NOT EXISTS last_dashboard_tab TEXT DEFAULT 'topics',
ADD COLUMN IF NOT EXISTS last_news_category TEXT DEFAULT 'general';

-- Migrate existing data from users table to user_preferences
-- We use an INSERT ... ON CONFLICT (upsert) to ensure rows exist
INSERT INTO user_preferences (user_id, theme, location, phone_number, notification_settings)
SELECT 
    auth_id, 
    'sunrise', -- default theme if creating new row
    jsonb_strip_nulls(jsonb_build_object(
        'name', location_name,
        'latitude', location_lat,
        'longitude', location_lon,
        'country', location_country,
        'admin1', location_admin1
    )),
    whatsapp_number,
    jsonb_build_object(
        'notification_method', notification_method,
        'notification_preferences', notification_preferences
    )
FROM users
ON CONFLICT (user_id) 
DO UPDATE SET
    location = EXCLUDED.location,
    phone_number = EXCLUDED.phone_number,
    notification_settings = EXCLUDED.notification_settings;

-- ============================================================================
-- Migration 4: Create flashcards, goals, and quotes tables
-- ============================================================================

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

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- You should now see these new tables in your Supabase Dashboard:
-- - game_scores
-- - user_preferences  
-- - daily_flashcards
-- - user_goals
-- - daily_quotes
-- ============================================================================

