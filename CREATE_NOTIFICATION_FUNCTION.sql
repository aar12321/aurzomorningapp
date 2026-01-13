-- Create the trigger_daily_notifications function
-- Run this in Supabase SQL Editor BEFORE scheduling the cron job

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cron_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cron_logs
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view cron logs (or adjust as needed)
DROP POLICY IF EXISTS "Users can view cron logs" ON public.cron_logs;
CREATE POLICY "Users can view cron logs" 
ON public.cron_logs FOR SELECT 
USING (true);  -- Allow viewing for now, adjust if needed

-- Create the function to call the daily-notifications edge function
CREATE OR REPLACE FUNCTION trigger_daily_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  supabase_url TEXT := 'https://lnvebvrayuveygycpolc.supabase.co';  -- TODO: Replace with your project URL
  service_role_key TEXT := 'REMOVED_SERVICE_ROLE_KEY';  -- TODO: Replace with your service role key
  request_id BIGINT;
  response_status INT;
  response_content TEXT;
BEGIN
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
      'Authorization', 'Bearer ' || service_role_key
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

-- Verify the function was created
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'trigger_daily_notifications';

-- Test the function (optional - uncomment to test)
-- SELECT trigger_daily_notifications();

-- After testing, check the logs to verify it worked:
-- SELECT * FROM public.cron_logs 
-- WHERE job_name = 'daily-notifications' 
-- ORDER BY executed_at DESC 
-- LIMIT 5;
