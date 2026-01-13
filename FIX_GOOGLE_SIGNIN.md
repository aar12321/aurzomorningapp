# Fix Google Sign-In Issues

## Common Issues and Solutions

### Issue 1: "Provider is not enabled" Error

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click on it
5. Toggle **Enable Google provider** to ON
6. Click **Save**

### Issue 2: Missing OAuth Credentials

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen if prompted
6. Create OAuth client ID:
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `https://lnvebvrayuveygycpolc.supabase.co`
     - `https://aurzomorning.com`
     - `https://aurzomorning.replit.app`
   - **Authorized redirect URIs:**
     - `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**
8. Go back to Supabase → **Authentication** → **Providers** → **Google**
9. Paste Client ID and Client Secret
10. Click **Save**

### Issue 3: Redirect URL Mismatch

**Solution:**
1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain:
   - `https://aurzomorning.com` (or your actual domain)
3. Add **Redirect URLs** (one per line):
   ```
   https://aurzomorning.com/overview
   https://aurzomorning.replit.app/overview
   http://localhost:5173/overview
   http://localhost:3000/overview
   ```

### Issue 4: OAuth Callback Not Working

**Check:**
- Make sure the redirect URI in Google Cloud Console matches exactly: `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`
- Verify all authorized JavaScript origins are added
- Check browser console for specific error messages

## Quick Checklist

- [ ] Google provider enabled in Supabase
- [ ] Client ID and Client Secret configured in Supabase
- [ ] OAuth credentials created in Google Cloud Console
- [ ] Redirect URI added to Google Cloud Console: `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`
- [ ] All authorized JavaScript origins added to Google Cloud Console
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs added in Supabase (including `/overview`)

## Testing

1. Clear browser cache and cookies
2. Try signing in with Google
3. Check browser console for errors
4. Check Supabase logs: **Authentication** → **Logs**

## Current Configuration

- **Redirect URL in code:** `/overview` (fixed)
- **Supabase Project:** `lnvebvrayuveygycpolc`
- **Callback URL:** `https://lnvebvrayuveygycpolc.supabase.co/auth/v1/callback`

