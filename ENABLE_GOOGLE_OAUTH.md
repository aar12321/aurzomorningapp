# Quick Fix: Enable Google OAuth in Supabase

The error "Unsupported provider: provider is not enabled" means Google OAuth is not enabled in your Supabase project.

## Step-by-Step Fix:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project

### 2. Navigate to Authentication Settings
- Click **Authentication** in the left sidebar
- Click **Providers** (or go directly to: Authentication → Providers)

### 3. Enable Google Provider
- Find **Google** in the list of providers
- Click on it to open the configuration
- Toggle the **Enable Google provider** switch to ON

### 4. Configure Google OAuth (if not already done)
You'll need:
- **Client ID** (from Google Cloud Console)
- **Client Secret** (from Google Cloud Console)

If you don't have these yet, follow the steps in `GOOGLE_OAUTH_SETUP.md` to create them.

### 5. Save and Test
- Click **Save** after enabling
- Try the Google sign-up again

## Quick Check:
After enabling, the Google provider should show as "Enabled" in green in your Supabase dashboard.

## Note:
If you haven't set up Google OAuth credentials yet, you'll need to:
1. Create OAuth credentials in Google Cloud Console
2. Add the redirect URI: `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client Secret to Supabase

See `GOOGLE_OAUTH_SETUP.md` for detailed instructions on creating Google OAuth credentials.

