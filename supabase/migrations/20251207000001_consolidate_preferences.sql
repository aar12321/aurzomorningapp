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
