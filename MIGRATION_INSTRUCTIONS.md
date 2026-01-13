# How to Run the Message Logs Migration

The `message_logs` table migration needs to be run manually in Supabase. Here's how:

## Option 1: Run via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Migration**
   - Open the file: `RUN_MESSAGE_LOGS_MIGRATION.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify**
   - Go to **Table Editor** in the left sidebar
   - You should now see `message_logs` table in the list
   - The table should have these columns:
     - id
     - user_id
     - message_type
     - recipient
     - subject
     - message_body
     - status
     - error_message
     - external_message_id
     - metadata
     - created_at
     - sent_at
     - delivered_at

## Option 2: Run via Supabase CLI

If you have Supabase CLI set up:

```bash
# Make sure you're in the project directory
cd C:\Users\aarya\Downloads\newoffical\morning-growth-loop

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
npx supabase db push
```

## What This Migration Does

- Creates `message_logs` table to track all sent notifications
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Allows users to view their own message history
- Allows service role (edge functions) to insert/update logs

## After Running

Once the migration is complete:
- ✅ The `message_logs` table will appear in your Supabase dashboard
- ✅ All future notifications will be logged automatically
- ✅ You can query message history in the SQL Editor
- ✅ Users can see their own message history (via RLS)

## Troubleshooting

If you get an error:
- Make sure you're running as the database owner/service role
- Check that the `users` table exists (it should)
- Verify RLS is enabled on the `users` table

