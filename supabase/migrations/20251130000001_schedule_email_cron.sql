-- Schedule the daily email function to run every hour
-- It will check if it's 7 AM in the user's timezone
-- IMPORTANT: Replace [YOUR_PROJECT_REF] and [YOUR_ANON_KEY] with your actual project values before running this.
-- You can find these in your Supabase Dashboard -> Project Settings -> API.

select cron.schedule(
  'send-daily-emails-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
    select
      net.http_post(
          url:='https://[YOUR_PROJECT_REF].supabase.co/functions/v1/send-daily-emails',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_ANON_KEY]"}'::jsonb
      ) as request_id;
  $$
);
