# WhatsApp Business API Setup Guide

This guide will walk you through setting up WhatsApp notifications for your users.

## Overview

WhatsApp Business API allows you to send messages to users who have opted in. The free tier includes:
- **1,000 conversations/month** for free
- After that, pay-per-conversation pricing

## Step-by-Step Setup

### Step 1: Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in your app details:
   - App Name: "Morning Growth Loop" (or your app name)
   - App Contact Email: your email
   - Business Account: Create new or use existing

### Step 2: Add WhatsApp Product

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. You'll be taken to the WhatsApp setup page

### Step 3: Get Your Phone Number

You have two options:

#### Option A: Use Meta's Test Number (Free, for testing)
- Meta provides a test phone number automatically
- Good for development/testing
- Limited functionality

#### Option B: Use Your Own Number (Production)
- Requires business verification
- More features available
- Can use your existing WhatsApp Business number

### Step 4: Get API Credentials

1. Go to WhatsApp → API Setup in your app dashboard
2. You'll see:
   - **Phone Number ID**: Copy this (you'll need it)
   - **Temporary Access Token**: Copy this (expires in 24 hours)
   - **Permanent Access Token**: You'll create this next

### Step 5: Create Permanent Access Token

1. Go to WhatsApp → API Setup
2. Click "Generate Token" or go to System Users
3. Create a System User with permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Generate a token for this system user
5. **Save this token securely** - you won't see it again

### Step 6: Add Environment Variables

**Important:** For Supabase Edge Functions, add these as **secrets** in the Supabase Dashboard, NOT in a `.env` file.

See `WHATSAPP_ENV_SETUP.md` for detailed instructions.

Add these secrets in Supabase Dashboard → Settings → Edge Functions → Secrets:

```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
APP_URL=https://aurzomorning.replit.app
```

### Step 7: Set Up Webhook (Optional, for receiving messages)

If you want to receive messages from users:

1. Go to WhatsApp → Configuration
2. Set up a webhook URL
3. Verify the webhook token
4. Subscribe to message events

For now, you only need to send messages, so this is optional.

## Testing

### Test with Your Phone Number

1. Add your phone number to the test recipient list:
   - Go to WhatsApp → API Setup
   - Add your phone number (with country code, e.g., +1234567890)
   - WhatsApp will send you a verification code

2. Test sending a message:

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "text",
    "text": { "body": "Hello! This is a test message." }
  }'
```

### Test via Your App

1. Go to your dashboard settings
2. Enable WhatsApp notifications
3. Enter your phone number (with country code)
4. Save preferences
5. Wait for the daily notification (or trigger manually)

## User Flow

1. **User enables WhatsApp** in settings
2. **User enters phone number** (with country code, e.g., +1234567890)
3. **System saves** phone number to database
4. **Daily cron job** sends message to all users with WhatsApp enabled
5. **User receives** WhatsApp message with quiz links

## Important Notes

### Phone Number Format
- Always include country code (e.g., +1 for US, +44 for UK)
- Remove spaces, dashes, parentheses
- Example: `+1234567890` (not `(123) 456-7890`)

### Message Templates (for production)
- Initially, you can send free-form messages
- For production, you may need to create message templates
- Templates require approval from Meta
- Templates are good for consistent messaging

### Rate Limits
- Free tier: 1,000 conversations/month
- After that: Pay per conversation
- Check Meta's pricing for current rates

### Opt-In Requirements
- Users must opt-in to receive messages
- You can't send unsolicited messages
- Users can opt-out by replying STOP
- Always include opt-out instructions in messages

## Troubleshooting

### Error: "Invalid phone number"
- Make sure phone number includes country code
- Remove all non-numeric characters except +

### Error: "User not opted in"
- User needs to message your WhatsApp Business number first
- Or add them as a test recipient in Meta dashboard

### Error: "Rate limit exceeded"
- You've hit your monthly limit
- Upgrade to paid tier or wait for next month

### Error: "Invalid access token"
- Token may have expired
- Generate a new permanent token
- Make sure you're using the System User token, not the temporary one

## Production Checklist

- [ ] Business verification completed
- [ ] Permanent access token generated
- [ ] Environment variables set in production
- [ ] Test messages working
- [ ] User opt-in flow implemented
- [ ] Message templates created (if needed)
- [ ] Error handling implemented
- [ ] Monitoring/logging set up

## Support

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

## Next Steps

1. Complete the setup above
2. Test with your phone number
3. Add notification settings UI (already created)
4. Test the daily notification cron job
5. Roll out to users!

