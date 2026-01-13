# Setting Up Daily Notifications Cron Jobs

## Why You Didn't Get Notifications

The cron jobs are **not automatically scheduled** when migrations run. You need to manually set them up in Supabase.

## Step-by-Step Setup

### 1. Enable pg_cron Extension

1. Go to Supabase Dashboard → Database → Extensions
2. Search for `pg_cron`
3. Click "Enable" if not already enabled

### 2. Enable pg_net Extension (for calling Edge Functions)

1. Go to Supabase Dashboard → Database → Extensions
2. Search for `pg_net`
3. Click "Enable" if not already enabled

### 3. Run the Migration to Create the Function

**IMPORTANT:** First, you need to run the migration to create the `trigger_daily_notifications()` function.

Go to Supabase Dashboard → SQL Editor and run this entire script:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the function to call the daily-notifications edge function
CREATE OR REPLACE FUNCTION trigger_daily_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  supabase_url TEXT := 'https://lnvebvrayuveygycpolc.supabase.co';  -- Replace with your project URL
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';  -- Replace with your service role key
  request_id BIGINT;
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
```

**Important:** Replace:
- `'https://lnvebvrayuveygycpolc.supabase.co'` with your actual Supabase project URL
- `'YOUR_SERVICE_ROLE_KEY'` with your actual service role key (found in Project Settings → API → service_role key)

### 4. Set Up Environment Variables

Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets and add:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 5. Schedule the Unlock Day Cron Job (8:00 AM EST)

Run this in Supabase SQL Editor:

```sql
-- Schedule unlock_day increment at 8:00 AM EST (13:00 UTC)
SELECT cron.schedule(
  'unlock-daily-content-8am-est',
  '0 13 * * *',  -- 8:00 AM EST = 13:00 UTC
  $$SELECT public.increment_unlock_day()$$
);
```

### 6. Schedule the Daily Notifications Cron Job (8:01 AM EST)

Run this in Supabase SQL Editor:

```sql
-- Schedule daily notifications at 8:01 AM EST (13:01 UTC)
-- This runs 1 minute after unlock_day increments
SELECT cron.schedule(
  'daily-notifications-8am-est',
  '1 13 * * *',  -- 8:01 AM EST = 13:01 UTC
  $$SELECT trigger_daily_notifications()$$
);
```

### 7. Verify Cron Jobs Are Scheduled

Run this to see all scheduled cron jobs:

```sql
SELECT * FROM cron.job;
```

You should see:
- `unlock-daily-content-8am-est` scheduled for `0 13 * * *`
- `daily-notifications-8am-est` scheduled for `1 13 * * *`

### 8. Test the Notifications Function

You can manually test the notifications function:

```sql
-- Test the function
SELECT trigger_daily_notifications();
```

Or call the Edge Function directly:

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/daily-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### 9. Check Cron Logs

View execution logs:

```sql
SELECT * FROM public.cron_logs 
WHERE job_name = 'daily-notifications' 
ORDER BY executed_at DESC 
LIMIT 10;
```

## Troubleshooting

### No notifications received?

1. **Check if cron jobs are scheduled:**
   ```sql
   SELECT * FROM cron.job;
   ```

2. **Check cron logs for errors:**
   ```sql
   SELECT * FROM public.cron_logs 
   WHERE job_name = 'daily-notifications' 
   ORDER BY executed_at DESC;
   ```

3. **Verify your notification preferences:**
   - Go to Settings → Notifications
   - Make sure Email or WhatsApp is enabled
   - For WhatsApp, make sure you've connected your phone number

4. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → daily-notifications
   - Check the "Logs" tab for errors

5. **Verify unlock_day is incrementing:**
   ```sql
   SELECT unlock_day, current_day FROM user_topics LIMIT 5;
   ```

### Cron job not running?

- Make sure `pg_cron` extension is enabled
- Check Supabase project limits (some plans have restrictions)
- Verify the cron schedule syntax is correct
- Check Supabase status page for any service issues

### Edge Function errors?

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Edge Function secrets
- Check Edge Function logs in Supabase Dashboard
- Make sure the `daily-notifications` function is deployed

## Manual Testing

To test notifications immediately without waiting for 8 AM:

```sql
-- Manually trigger unlock (if needed)
SELECT public.increment_unlock_day();

-- Manually trigger notifications
SELECT trigger_daily_notifications();
```

## Timezone Notes

- **8:00 AM EST** = **13:00 UTC** (1:00 PM UTC)
- **8:01 AM EST** = **13:01 UTC** (1:01 PM UTC)
- EST = Eastern Standard Time (UTC-5)
- EDT = Eastern Daylight Time (UTC-4) - adjust accordingly

If you're in EDT (daylight saving time), use:
- `'0 12 * * *'` for 8:00 AM EDT
- `'1 12 * * *'` for 8:01 AM EDT

