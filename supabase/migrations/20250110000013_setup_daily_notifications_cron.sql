-- Setup pg_cron for daily notifications at 8:01 AM EST (13:01 UTC)
-- This runs after unlock_day increments at 8:00 AM EST
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the daily-notifications edge function
CREATE OR REPLACE FUNCTION trigger_daily_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Get Supabase URL and service role key from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If not set, use defaults (these should be set in Supabase dashboard)
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://lnvebvrayuveygycpolc.supabase.co';
  END IF;
  
  edge_function_url := supabase_url || '/functions/v1/daily-notifications';
  
  RAISE NOTICE 'Triggering daily notifications cron job at %', now();
  RAISE NOTICE 'Calling edge function: %', edge_function_url;
  
  -- Use pg_net to call the edge function
  -- net.http_post returns a request_id (BIGINT) but we can't query http_response in PL/pgSQL
  -- So we'll fire-and-forget and log that we triggered it
  -- The Edge Function will handle its own error logging
  SELECT * INTO request_id FROM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := '{}'::jsonb
  );
  
  -- Log that we triggered the function
  -- Note: We can't check the response in PL/pgSQL, but the Edge Function will log errors
  INSERT INTO public.cron_logs (job_name, executed_at, status, message)
  VALUES ('daily-notifications', now(), 'running', 'Daily notifications trigger sent (request_id: ' || request_id || '). Check Edge Function logs for results.');
  RAISE NOTICE 'Daily notifications trigger sent (request_id: %)', request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.cron_logs (job_name, executed_at, status, message)
    VALUES ('daily-notifications', now(), 'error', SQLERRM);
    RAISE;
END;
$$;

-- Schedule the cron job to run daily at 8:01 AM EST (13:01 UTC)
-- This runs 1 minute after unlock_day increments at 8:00 AM EST
-- Note: 8 AM EST = 1 PM UTC (13:00), so 8:01 AM EST = 13:01 UTC
SELECT cron.schedule(
  'daily-notifications-8am-est',
  '1 13 * * *',  -- 8:01 AM EST = 13:01 UTC
  $$SELECT trigger_daily_notifications()$$
);

-- Add comment
COMMENT ON FUNCTION trigger_daily_notifications() IS 'Triggers the daily-notifications edge function. Called by pg_cron at 8:01 AM EST daily, after unlock_day increments.';

