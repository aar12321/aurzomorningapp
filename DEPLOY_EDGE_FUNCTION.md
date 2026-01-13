# Deploy Edge Function for Flashcards

The error `net::ERR_FAILED` indicates the Edge Function `generate-flashcards` is not deployed to Supabase.

## Quick Fix: Deploy the Edge Function

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project: `lnvebvrayuveygycpolc`

2. **Navigate to Edge Functions**
   - Click **"Edge Functions"** in the left sidebar
   - Or go to: https://supabase.com/dashboard/project/lnvebvrayuveygycpolc/functions

3. **Create New Function**
   - Click **"Create a new function"** or **"New Function"**
   - Name it: `generate-flashcards`
   - Click **"Create function"**

4. **Copy the Code**
   - Open `supabase/functions/generate-flashcards/index.ts` from your project
   - Copy ALL the code
   - Paste it into the Supabase editor
   - Click **"Deploy"**

5. **Set Environment Variable**
   - Go to **Project Settings** → **Edge Functions** → **Secrets**
   - Add secret:
     - **Name:** `OPENAI_API_KEY`
     - **Value:** Your OpenAI API key
   - Click **"Save"**

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref lnvebvrayuveygycpolc

# Deploy the function
npx supabase functions deploy generate-flashcards

# Set the OpenAI API key secret
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

### Option 3: Manual Upload via Dashboard

1. Go to Edge Functions in Supabase Dashboard
2. Click **"Create function"**
3. Name: `generate-flashcards`
4. Copy the entire contents of `supabase/functions/generate-flashcards/index.ts`
5. Paste into the editor
6. Click **"Deploy"**
7. Add the `OPENAI_API_KEY` secret in Project Settings → Edge Functions → Secrets

## Verify Deployment

After deploying, test the function:

1. Go to Edge Functions in Supabase Dashboard
2. Click on `generate-flashcards`
3. Click **"Invoke"** tab
4. Test with this JSON:
```json
{
  "topicType": "life",
  "topicName": null
}
```

If it works, you should see flashcards returned.

## Troubleshooting

### If you get "Function not found" error:
- Make sure the function name is exactly `generate-flashcards` (lowercase, with hyphen)
- Check that it's deployed (should show "Active" status)

### If you get OpenAI API errors:
- Make sure `OPENAI_API_KEY` secret is set in Supabase
- Verify the API key is valid and has credits

### If you get CORS errors:
- The function already has CORS headers configured
- Make sure you're calling it from an authenticated session

## After Deployment

Once deployed, the flashcards should load correctly when you click on topic tiles in the Learn tab!

