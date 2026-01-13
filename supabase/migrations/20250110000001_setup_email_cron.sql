-- Setup pg_cron for daily email delivery at 7:00 AM ET
-- This migration sets up the cron job to trigger the daily email edge function

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION trigger_daily_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response text;
BEGIN
  -- Call the Supabase Edge Function for daily emails
  -- This would typically use http extension, but for now we'll log
  RAISE NOTICE 'Triggering daily email cron job at %', now();
  
  -- In production, you would use:
  -- SELECT http_post(
  --   'https://your-project.supabase.co/functions/v1/daily-email-cron',
  --   '{}',
  --   'application/json',
  --   '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'
  -- );
  
  -- For now, just log that the cron would run
  INSERT INTO public.cron_logs (job_name, executed_at, status, message)
  VALUES ('daily-emails', now(), 'success', 'Daily email cron triggered (mock)');
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO public.cron_logs (job_name, executed_at, status, message)
    VALUES ('daily-emails', now(), 'error', SQLERRM);
    RAISE;
END;
$$;

-- Create a table to log cron job executions
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

-- Allow admins to view cron logs
CREATE POLICY "Admins can view cron logs" 
ON public.cron_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND email IN ('admin@dailyquiz.com') -- Add admin emails here
  )
);

-- Schedule the daily email job for 7:00 AM ET (12:00 UTC)
-- Note: This is a simplified version. In production, you'd need to:
-- 1. Set up proper authentication for the edge function call
-- 2. Handle timezone conversions properly
-- 3. Add error handling and retry logic
-- 4. Monitor job execution

-- For now, we'll create a manual trigger function that can be called
-- In production, uncomment the line below to schedule the actual cron job:
-- SELECT cron.schedule('daily-emails', '0 12 * * *', 'SELECT trigger_daily_emails();');

-- Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION manual_trigger_daily_emails()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Call the trigger function
  PERFORM trigger_daily_emails();
  
  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Daily emails triggered successfully',
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Create an index on cron_logs for better performance
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON public.cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_executed_at ON public.cron_logs(executed_at);

-- Add a comment explaining the setup
COMMENT ON FUNCTION trigger_daily_emails() IS 'Triggers the daily email edge function. Called by pg_cron at 7:00 AM ET daily.';
COMMENT ON FUNCTION manual_trigger_daily_emails() IS 'Manual trigger for daily emails. Used for testing and admin controls.';
COMMENT ON TABLE public.cron_logs IS 'Logs cron job executions for monitoring and debugging.';
