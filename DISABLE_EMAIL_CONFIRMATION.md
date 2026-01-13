# Disable Email Confirmation in Supabase

To remove the email confirmation requirement and allow users to sign up and immediately access their dashboard:

## Steps in Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** (or **Providers**)
3. Find the **Email** provider settings
4. **Disable "Enable email confirmations"** or toggle it OFF
5. Save the changes

## What This Does:

- Users will be automatically signed in after signup
- No confirmation email will be sent
- Users go directly to dashboard after signup
- Sessions are persisted in localStorage for long-term login

## Session Duration:

The code is configured to:
- Persist sessions in localStorage
- Auto-refresh tokens when they expire
- Keep users logged in as long as possible

**Note:** The JWT token expiry is set in Supabase dashboard (default is 1 hour). To extend it:
1. Go to **Authentication** → **Settings**
2. Find **JWT expiry time** (or **Token expiry**)
3. Set it to a longer duration (e.g., 7 days, 30 days, or as long as needed)
4. Save changes

After making these changes, users will:
- Sign up → Automatically logged in → Taken to dashboard
- Stay logged in for the extended duration you set

