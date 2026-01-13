-- Add reminders_enabled and timezone to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Index for faster querying by timezone and reminders
CREATE INDEX IF NOT EXISTS idx_users_reminders_timezone 
ON public.users (timezone, reminders_enabled);
