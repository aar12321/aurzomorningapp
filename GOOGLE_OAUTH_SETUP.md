# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Supabase project.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to your Supabase project dashboard

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`
   - Add test users if needed (for testing before verification)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: Your app name (e.g., "Morning Growth Loop")
   - Authorized JavaScript origins:
     - `https://lnvebvrayuveygycpolc.supabase.co` (your Supabase project URL)
     - `https://aurzomorning.com`
     - `https://aurzomorning.replit.app`
   - Authorized redirect URIs:
     - `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to configure
5. Enable Google provider
6. Enter your **Client ID** and **Client Secret** from Step 1
7. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

**IMPORTANT:** You must configure the redirect URLs in Supabase so users are redirected to the dashboard after OAuth.

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Configure the following:
   - **Site URL**: `https://aurzomorning.com` (or `https://aurzomorning.replit.app`)
   - **Redirect URLs**: Add these URLs (one per line):
     - `https://aurzomorning.com/overview`
     - `https://aurzomorning.replit.app/overview`
     - `http://localhost:5173/overview` (for local development)
     - `http://localhost:3000/overview` (if using a different port)
   
   **Note:** The redirect URL must match exactly where your app is hosted. After Google OAuth completes, users will be redirected to `/overview`.

## Step 4: Test the Integration

1. Go to your signup page
2. Click "Sign up with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to your dashboard

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console matches exactly: `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`
- Check that you've added all necessary authorized JavaScript origins

### "OAuth client not found" error
- Verify the Client ID is correct in Supabase
- Make sure the OAuth client is enabled in Google Cloud Console

### User profile not created
- Check that the `handle_new_user()` trigger function exists in your database
- Verify RLS policies allow user creation

## Notes

- For production, you'll need to verify your OAuth consent screen with Google
- The redirect URL format is: `https://[your-supabase-project].supabase.co/auth/v1/callback`
- Users signing up with Google will have their topics created automatically after OAuth completes

