# Database Migrations Guide

This guide explains how to automatically apply database migrations to your Supabase project.

## Quick Start

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   # Windows (using Scoop)
   scoop install supabase
   
   # Windows (using Chocolatey)
   choco install supabase
   
   # Or download from: https://github.com/supabase/cli/releases
   ```

2. **Login to Supabase**:
   ```bash
   npx supabase login
   ```
   This will open your browser to authenticate.

3. **Link your project**:
   ```bash
   npx supabase link --project-ref lnvebvrayuveygycpolc
   ```

4. **Push migrations**:
   ```bash
   npx supabase db push
   ```

### Option 2: Using npx (No Installation)

You can use npx to run the Supabase CLI without installing it:

```bash
# Login first
npx supabase login

# Link project
npx supabase link --project-ref lnvebvrayuveygycpolc

# Push migrations
npx supabase db push
```

### Option 3: Manual SQL Execution

If you prefer to run migrations manually:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Run each migration file in order:

   - `supabase/migrations/20251201000002_add_location_and_game_scores.sql`
   - `supabase/migrations/20251207000000_create_user_preferences.sql`
   - `supabase/migrations/20251207000001_consolidate_preferences.sql`
   - `supabase/migrations/20250120000001_add_flashcards_and_goals.sql`

## Migration Files

The following migrations need to be applied:

1. **20251201000002_add_location_and_game_scores.sql**
   - Adds location fields to users table
   - Creates `game_scores` table for tracking game statistics

2. **20251207000000_create_user_preferences.sql**
   - Creates `user_preferences` table
   - Sets up RLS policies for user preferences

3. **20251207000001_consolidate_preferences.sql**
   - Adds additional preference columns
   - Migrates existing data from users table

4. **20250120000001_add_flashcards_and_goals.sql**
   - Creates `daily_flashcards` table for AI-generated content caching
   - Creates `user_goals` table for daily goals
   - Creates `daily_quotes` table for shared inspirational quotes

## Troubleshooting

### "Failed to parse environment file"
If you see this error, check your `.env` file for invalid characters or encoding issues.

### "Project not linked"
Make sure you've run `supabase link --project-ref lnvebvrayuveygycpolc` first.

### "Authentication failed"
Run `npx supabase login` again to refresh your authentication token.

## Verification

After running migrations, verify the tables were created:

1. Go to Supabase Dashboard → Table Editor
2. You should see these new tables:
   - `game_scores`
   - `user_preferences`
   - `daily_flashcards`
   - `user_goals`
   - `daily_quotes`

## Need Help?

If you encounter any issues:
1. Check the Supabase CLI documentation: https://supabase.com/docs/reference/cli
2. Verify your project reference ID matches: `lnvebvrayuveygycpolc`
3. Ensure you have the correct permissions in your Supabase project

