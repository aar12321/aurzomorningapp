# Setting WhatsApp Environment Variables in Supabase

For Supabase Edge Functions, you need to set environment variables in the Supabase Dashboard, **not** in a `.env` file.

## Step-by-Step: Add Secrets to Supabase

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Select your project
   - Go to **Project Settings** (gear icon in left sidebar)

2. **Navigate to Edge Functions**
   - Click on **"Edge Functions"** in the settings menu
   - Or go directly to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions`

3. **Add Secrets**
   - Look for **"Secrets"** or **"Environment Variables"** section
   - Click **"Add new secret"** or **"New secret"**

4. **Add WhatsApp Credentials**
   
   **Secret 1:**
   - **Name:** `WHATSAPP_PHONE_NUMBER_ID`
   - **Value:** Your phone number ID from Meta dashboard (e.g., `123456789012345`)
   - Click **"Save"**

   **Secret 2:**
   - **Name:** `WHATSAPP_ACCESS_TOKEN`
   - **Value:** Your permanent access token from Meta dashboard
   - Click **"Save"**

   **Optional:**
   - **Name:** `APP_URL`
   - **Value:** `https://aurzomorning.replit.app` (or your app URL)
   - Click **"Save"**

### Method 2: Via Supabase CLI

If you prefer using the CLI:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_access_token
supabase secrets set APP_URL=https://aurzomorning.replit.app
```

### How to Find Your Project Ref

1. Go to Supabase Dashboard
2. Click on your project
3. Go to **Settings** → **General**
4. Look for **"Reference ID"** - that's your project ref

## Verify Secrets Are Set

After adding secrets, you can verify they're accessible:

1. Go to **Edge Functions** in Supabase Dashboard
2. Click on your `daily-notifications` function
3. The secrets will be available as environment variables in the function

## Important Notes

- ✅ Secrets are **encrypted** and **secure**
- ✅ Only accessible to Edge Functions
- ✅ Never commit secrets to git
- ❌ Don't put them in `.env` files (those are for local development only)
- ❌ Don't hardcode them in your function code

## Testing

After setting secrets, test your function:

1. Go to **Edge Functions** → **daily-notifications**
2. Click **"Invoke function"** or use the API endpoint
3. Check logs to see if WhatsApp credentials are working

## Troubleshooting

**"Secret not found" error:**
- Make sure you spelled the secret name exactly: `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
- Make sure you're in the correct Supabase project
- Wait a few minutes after adding secrets (they may take a moment to propagate)

**"Access token invalid" error:**
- Make sure you're using the **permanent token**, not the temporary one
- Regenerate the token if needed
- Check that the token hasn't expired

