-- Daily content unlock at 8 AM EST
-- This function will unlock the next day for all user_topics at 8 AM EST every day

-- Add unlock_day column to user_topics if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_topics' AND column_name = 'unlock_day'
  ) THEN
    ALTER TABLE public.user_topics ADD COLUMN unlock_day INTEGER DEFAULT 1;
  END IF;
END $$;

-- Function to increment unlock_day for all users
CREATE OR REPLACE FUNCTION public.increment_unlock_day()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment unlock_day for all user topics
  -- This allows users to access the next day's quiz at 8 AM EST
  UPDATE public.user_topics
  SET unlock_day = unlock_day + 1;
  
  -- Log the unlock event
  INSERT INTO public.unlock_log (unlock_date, topics_unlocked)
  VALUES (CURRENT_DATE, (SELECT COUNT(*) FROM public.user_topics));
EXCEPTION WHEN others THEN
  -- If unlock_log table doesn't exist, just continue
  NULL;
END;
$$;

-- Create the unlock_log table for tracking unlocks
CREATE TABLE IF NOT EXISTS public.unlock_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unlock_date DATE NOT NULL,
  topics_unlocked INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_topics_unlock_day ON public.user_topics(unlock_day);
CREATE INDEX IF NOT EXISTS idx_user_topics_current_day ON public.user_topics(current_day);

-- Note: To enable pg_cron and schedule the function, run this in Supabase SQL Editor:
-- SELECT cron.schedule(
--   'unlock-daily-content-8am-est',
--   '0 13 * * *',  -- 8 AM EST = 1 PM UTC (13:00)
--   $$SELECT public.increment_unlock_day()$$
-- );

