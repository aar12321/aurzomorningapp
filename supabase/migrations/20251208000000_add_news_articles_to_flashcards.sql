-- Add news_articles column to daily_flashcards for storing news used in daily_learn
ALTER TABLE public.daily_flashcards
ADD COLUMN IF NOT EXISTS news_articles JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_flashcards_news ON public.daily_flashcards(topic_type, date) 
WHERE topic_type = 'daily_learn';

