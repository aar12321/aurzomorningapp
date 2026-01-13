# WhatsApp Production Setup Guide

## Current Issue: Phone Number Not in Allowed List

You're getting error `131030: Recipient phone number not in allowed list`. This happens because:

### In Test/Development Mode:
- WhatsApp requires you to **manually add each recipient** to an allowed list
- This is a security feature to prevent spam during development
- You must add phone numbers in Meta Dashboard → WhatsApp → API Setup → Recipients

### Solutions for Production:

## Option 1: Complete Business Verification (Recommended)

Once your Meta Business Account is verified, you can send to **any phone number** without adding them manually.

**Steps:**
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Complete business verification
3. Verify your WhatsApp Business Account
4. Once verified, you can send to any number (users just need to opt-in)

**Benefits:**
- No need to manually add recipients
- Can send to any verified number
- Better for scaling

## Option 2: Use Template Messages

Template messages are pre-approved message formats that can be sent outside the 24-hour messaging window.

**Steps:**
1. Go to Meta Dashboard → WhatsApp → Message Templates
2. Create a template (e.g., "daily_quiz_reminder")
3. Get it approved by Meta (usually takes 24-48 hours)
4. Update the Edge Function to use template messages instead of text messages

**Template Example:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+1234567890",
  "type": "template",
  "template": {
    "name": "daily_quiz_reminder",
    "language": { "code": "en" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "John" },
          { "type": "text", "text": "Algebra, Chemistry" }
        ]
      }
    ]
  }
}
```

## Option 3: 24-Hour Messaging Window

Users must message your WhatsApp Business number first, then you can send them messages for 24 hours.

**Limitation:** Not practical for daily automated reminders.

## Checking Phone Number Format

Run this query to check how phone numbers are stored:

```sql
SELECT 
  id,
  full_name,
  whatsapp_number,
  notification_method,
  LENGTH(whatsapp_number) as number_length,
  CASE 
    WHEN whatsapp_number LIKE '+%' THEN 'Has + prefix'
    ELSE 'Missing + prefix'
  END as format_check
FROM users
WHERE whatsapp_number IS NOT NULL;
```

## For Now (Test Mode):

1. **Add your phone number to the allowed list:**
   - Go to Meta Dashboard → WhatsApp → API Setup
   - Find "To" or "Recipients" section
   - Click "Manage phone number list"
   - Add your number in E.164 format: `+1234567890` (with country code)

2. **Verify the number format in your database:**
   - Run the query above
   - Make sure numbers start with `+` and include country code
   - Example: `+14155551234` (not `14155551234` or `4155551234`)

3. **Test again:**
   ```sql
   SELECT trigger_daily_notifications();
   ```

## Next Steps:

1. **For immediate testing:** Add your phone number to the allowed list in Meta Dashboard
2. **For production:** Complete business verification OR create template messages
3. **Monitor logs:** Check Edge Function logs to see which users are receiving messages

## Troubleshooting:

- **Error 131030:** Phone number not in allowed list → Add to Meta Dashboard
- **Error 131047:** Outside 24-hour window → Use template messages or complete verification
- **Error 190:** Access token expired → Refresh token in Supabase secrets
- **No error but no message:** Check phone number format (must be E.164: +1234567890)

