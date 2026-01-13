-- =====================================================
-- SQL Migration: Support for 90 Topics in Learn Tab
-- =====================================================
-- This migration ensures the database can handle all 90 topics
-- with proper caching, indexing, and security policies.
-- =====================================================

-- 1. Ensure daily_flashcards table exists with all required columns
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_type TEXT NOT NULL,
  topic_name TEXT, -- NULL for daily_learn and cooking, specific name for other topics
  date DATE NOT NULL,
  flashcards JSONB NOT NULL,
  news_articles JSONB, -- For daily_learn topic, stores the news articles used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add news_articles column if it doesn't exist
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_flashcards' 
    AND column_name = 'news_articles'
  ) THEN
    ALTER TABLE public.daily_flashcards 
    ADD COLUMN news_articles JSONB;
  END IF;
END $$;

-- 3. Create indexes for better query performance
-- =====================================================

-- Unique index that properly handles NULL values
-- This ensures one generation per day per topic for all users
CREATE UNIQUE INDEX IF NOT EXISTS daily_flashcards_unique_idx 
ON public.daily_flashcards(topic_type, date, COALESCE(topic_name, ''));

-- Index for querying by topic_type and date (most common query)
CREATE INDEX IF NOT EXISTS idx_daily_flashcards_topic_date 
ON public.daily_flashcards(topic_type, date);

-- Index for querying by topic_name (for specific topics)
CREATE INDEX IF NOT EXISTS idx_daily_flashcards_topic_name 
ON public.daily_flashcards(topic_name) 
WHERE topic_name IS NOT NULL;

-- Index for date queries (for cleanup/analytics)
CREATE INDEX IF NOT EXISTS idx_daily_flashcards_date 
ON public.daily_flashcards(date);

-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_daily_flashcards_topic_type_name_date 
ON public.daily_flashcards(topic_type, COALESCE(topic_name, ''), date);

-- 4. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.daily_flashcards ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
-- Drop all possible policy names that might exist from previous migrations
DROP POLICY IF EXISTS "Anyone can read daily flashcards" ON public.daily_flashcards;
DROP POLICY IF EXISTS "Daily flashcards are viewable by everyone" ON public.daily_flashcards;
DROP POLICY IF EXISTS "Service role can insert daily flashcards" ON public.daily_flashcards;
DROP POLICY IF EXISTS "Service role can update daily flashcards" ON public.daily_flashcards;
DROP POLICY IF EXISTS "Authenticated users can insert daily flashcards" ON public.daily_flashcards;

-- Policy: Anyone authenticated can read flashcards (they're shared content)
CREATE POLICY "Anyone can read daily flashcards"
ON public.daily_flashcards
FOR SELECT
TO authenticated
USING (true);

-- Policy: Service role can insert flashcards (via Edge Function)
CREATE POLICY "Service role can insert daily flashcards"
ON public.daily_flashcards
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Service role can update flashcards (via Edge Function)
CREATE POLICY "Service role can update daily flashcards"
ON public.daily_flashcards
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can insert (for Edge Function with user context)
-- This allows the Edge Function to insert when called by authenticated users
CREATE POLICY "Authenticated users can insert daily flashcards"
ON public.daily_flashcards
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Create function to update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_daily_flashcards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-update updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_daily_flashcards_updated_at_trigger ON public.daily_flashcards;
CREATE TRIGGER update_daily_flashcards_updated_at_trigger
  BEFORE UPDATE ON public.daily_flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_flashcards_updated_at();

-- 8. Add comments for documentation
-- =====================================================
COMMENT ON TABLE public.daily_flashcards IS 'Stores daily flashcards for all topics. Each topic generates once per day and is shared by all users.';
COMMENT ON COLUMN public.daily_flashcards.topic_type IS 'Type of topic: daily_learn, cooking, life, work_money, world_society, self_growth, or topic (for the 90 specific topics)';
COMMENT ON COLUMN public.daily_flashcards.topic_name IS 'Specific topic name for the 90 topics (e.g., "Personal Finance", "Project Management"). NULL for daily_learn and cooking.';
COMMENT ON COLUMN public.daily_flashcards.date IS 'Date for which these flashcards were generated (YYYY-MM-DD)';
COMMENT ON COLUMN public.daily_flashcards.flashcards IS 'JSONB array of flashcard objects: [{"front": "...", "back": "...", "order": 1}, ...]';
COMMENT ON COLUMN public.daily_flashcards.news_articles IS 'JSONB array of news articles used for daily_learn topic: [{"title": "...", "summary": "..."}, ...]';

-- 9. Ensure daily_quotes table exists (for completeness)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  quote_text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for daily_quotes
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_quotes
DROP POLICY IF EXISTS "Anyone can read daily quotes" ON public.daily_quotes;
CREATE POLICY "Anyone can read daily quotes"
ON public.daily_quotes
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can insert daily quotes" ON public.daily_quotes;
CREATE POLICY "Service role can insert daily quotes"
ON public.daily_quotes
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert daily quotes" ON public.daily_quotes;
CREATE POLICY "Authenticated users can insert daily quotes"
ON public.daily_quotes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for daily_quotes
CREATE INDEX IF NOT EXISTS idx_daily_quotes_date ON public.daily_quotes(date);

-- 10. Optional: Create a view for analytics (topic usage stats)
-- =====================================================
CREATE OR REPLACE VIEW public.flashcard_usage_stats AS
SELECT 
  topic_type,
  topic_name,
  COUNT(*) as total_days,
  MIN(date) as first_created,
  MAX(date) as last_created,
  COUNT(DISTINCT date) as unique_dates
FROM public.daily_flashcards
GROUP BY topic_type, topic_name
ORDER BY total_days DESC, topic_type, topic_name;

-- Grant access to the view
GRANT SELECT ON public.flashcard_usage_stats TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================
-- The database is now ready to support all 90 topics:
-- - 30 original topics (life, work_money, world_society, self_growth, cooking)
-- - 60 new specific topics (using topic_type='topic' and topic_name)
-- 
-- Each topic will:
-- 1. Generate flashcards once per day (via Edge Function)
-- 2. Cache in daily_flashcards table
-- 3. Be shared by all users on that day
-- 4. Be queryable efficiently via indexes
-- =====================================================

