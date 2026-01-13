# WhatsApp Access Token Expired - How to Fix

## The Problem

Your WhatsApp access token expired on **November 6, 2025**. You need to get a new permanent token.

## Quick Fix Steps

### Step 1: Get a New Permanent Access Token

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app (the one you created for WhatsApp)
3. Go to **WhatsApp** → **API Setup**
4. You'll see a "Temporary Access Token" (expires in 24 hours) - **don't use this**
5. Instead, create a **Permanent Access Token**:

#### Option A: Using System Users (Recommended for Production)

1. Go to **Settings** → **Business Settings** → **System Users**
2. Click **Add** to create a new System User
3. Give it a name (e.g., "WhatsApp Notification Bot")
4. Assign it the role: **Admin** or **Employee**
5. Click **Generate New Token**
6. Select your app from the dropdown
7. Select these permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
8. Click **Generate Token**
9. **COPY THE TOKEN IMMEDIATELY** - you won't see it again!
10. Save it securely

#### Option B: Using Graph API Explorer (Quick Test)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Generate the token
6. **Note:** This token may still expire. Use System Users for permanent tokens.

### Step 2: Get Your Phone Number ID

1. Still in **WhatsApp** → **API Setup**
2. Copy the **Phone Number ID** (it's a long number like `123456789012345`)

### Step 3: Update Secrets in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Update these secrets:

   ```
   WHATSAPP_ACCESS_TOKEN=your_new_permanent_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   ```

5. Click **Save** or **Update** for each secret

### Step 4: Verify It Works

1. Go to **Edge Functions** → **daily-notifications** → **Logs**
2. Manually trigger the function or wait for the next scheduled run
3. Check the logs - you should see:
   - ✅ `✓ WhatsApp sent successfully to +[number]`
   - ❌ No more "Session has expired" errors

## Important Notes

- **Permanent tokens from System Users don't expire** (unless you revoke them)
- **Temporary tokens expire in 24 hours** - don't use these for production
- If you're still in test mode, make sure your phone number is in the **Recipients** list:
  - Go to **WhatsApp** → **API Setup** → **Recipients**
  - Add your phone number (with country code, e.g., `+16307708261`)

## Troubleshooting

If you still get errors after updating the token:

1. **Check token permissions**: Make sure it has `whatsapp_business_messaging` permission
2. **Verify Phone Number ID**: Make sure it matches your WhatsApp Business number
3. **Check recipient list**: If in test mode, your number must be in the allowed recipients
4. **Wait a few minutes**: Sometimes it takes a minute for the new token to propagate

## Need Help?

If you're having trouble:
- Check the [Meta WhatsApp API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- Verify your app is in the correct mode (Development vs Production)
- Make sure your Meta Business Account is verified (for production use)

