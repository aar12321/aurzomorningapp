-- Set JWT expiry to 30 days (or longer)
-- Run this in Supabase SQL Editor

-- Note: JWT expiry is typically set in the dashboard, but if you need to set it via SQL:
-- This updates the auth config to extend JWT expiry

-- First, check current JWT expiry settings
SELECT 
  name,
  raw_base_config->>'jwt_expiry' as jwt_expiry
FROM auth.config
WHERE name = 'jwt_expiry';

-- If the above doesn't work, you may need to set it via Supabase dashboard:
-- 1. Go to Project Settings → API
-- 2. Look for "JWT expiry" or "JWT Settings"
-- 3. Set to desired duration (e.g., 2592000 seconds = 30 days)

-- IMPORTANT: The JWT expiry setting is usually configured in the Supabase dashboard
-- under Project Settings → API → JWT Settings, not via SQL.

