-- Add notification preferences to users table
-- This allows users to choose their preferred notification method and content

-- Add notification preferences columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS notification_method TEXT[] DEFAULT ARRAY['email']::TEXT[],
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "include_news": false,
  "include_quotes": false,
  "include_challenge": false,
  "news_categories": ["general"]
}'::JSONB,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- Add constraint to ensure valid notification methods
ALTER TABLE public.users
ADD CONSTRAINT valid_notification_methods 
CHECK (
  notification_method <@ ARRAY['email', 'whatsapp', 'telegram', 'slack', 'instagram']::TEXT[]
);

-- Create index for notification preferences
CREATE INDEX IF NOT EXISTS idx_users_notification_method 
ON public.users USING GIN (notification_method);

-- Add comment to document the notification preferences JSONB structure
COMMENT ON COLUMN public.users.notification_preferences IS 'User preferences for notification content: {
  "include_news": boolean,
  "include_quotes": boolean,
  "include_challenge": boolean,
  "news_categories": ["general", "sports", "stocks", "technology"]
}';

