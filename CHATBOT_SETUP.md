# Chatbot Notification Setup Guide

This guide explains how to set up chatbot notifications for WhatsApp, Telegram, Slack, Instagram, and iOS Push Notifications.

**Note**: For iOS users, we recommend using **Push Notifications** (see `IOS_PUSH_NOTIFICATIONS.md`) instead of trying to send iMessages directly, as Apple doesn't provide a public iMessage API.

## Overview

Users can choose to receive daily quiz reminders via:
- **Email** (existing)
- **WhatsApp** (via Meta WhatsApp Business API)
- **Telegram** (via Telegram Bot API)
- **Slack** (via Slack Web API)
- **Instagram** (via Instagram Messaging API)

Each notification can optionally include:
- 📰 News from the past 24 hours (sports/news/stocks)
- 💭 Motivational quotes
- 🎯 Daily goal/challenge

## Platform Setup

### 1. WhatsApp (Meta WhatsApp Business API)

**Cost**: Free tier available (1000 conversations/month)

**Setup Steps**:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app and add "WhatsApp" product
3. Get your Phone Number ID and Access Token
4. Add environment variables:
   ```
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_access_token
   ```

**User Setup**:
- Users need to save your WhatsApp Business number
- Send a message to your number to opt-in
- Store their phone number in `users.whatsapp_number` (format: +1234567890)

### 2. Telegram (Telegram Bot API)

**Cost**: Free

**Setup Steps**:
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token
4. Add environment variable:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   ```

**User Setup**:
- Users start a conversation with your bot
- Bot sends them a unique code or link
- Store their chat_id in `users.telegram_username` (actually chat_id)

### 3. Slack (Slack Web API)

**Cost**: Free for basic usage

**Setup Steps**:
1. Go to [api.slack.com](https://api.slack.com/apps)
2. Create a new app for your workspace
3. Add "OAuth & Permissions" scope: `chat:write`
4. Install app to workspace
5. Get Bot User OAuth Token
6. Add environment variable:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   ```

**User Setup**:
- Users invite your bot to their workspace or DM
- Bot sends them a link to connect
- Store their Slack user ID in `users.slack_user_id`

### 4. Instagram (Instagram Messaging API)

**Cost**: Free tier available

**Setup Steps**:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a Facebook Page (required for Instagram)
3. Connect Instagram Business account to the page
4. Add "Instagram" product to your app
5. Get Page Access Token
6. Add environment variables:
   ```
   INSTAGRAM_ACCESS_TOKEN=your_page_access_token
   INSTAGRAM_PAGE_ID=your_page_id
   ```

**User Setup**:
- Users must message your Instagram account first
- Store their Instagram user ID in `users.instagram_username`

## Content APIs

### News API (NewsAPI.org)

**Cost**: Free tier: 100 requests/day

**Setup**:
1. Sign up at [newsapi.org](https://newsapi.org/)
2. Get your API key
3. Add environment variable:
   ```
   NEWS_API_KEY=your_api_key
   ```

**Alternative APIs**:
- Guardian API (free, no key needed)
- NewsData.io (free tier)
- GNews API (free tier)

### Quotes API

**Cost**: Free (Quotable.io)

No setup needed - uses public API.

## Environment Variables

Add these to your `.env` file:

```env
# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_page_access_token
INSTAGRAM_PAGE_ID=your_page_id

# News API
NEWS_API_KEY=your_news_api_key

# App URL
APP_URL=https://aurzomorning.replit.app
```

## Database Schema

The migration adds these columns to `users` table:

- `notification_method`: TEXT[] - Array of methods user wants (e.g., ['email', 'whatsapp'])
- `notification_preferences`: JSONB - Content preferences
- `whatsapp_number`: TEXT - User's WhatsApp number
- `telegram_username`: TEXT - User's Telegram chat_id
- `slack_user_id`: TEXT - User's Slack user ID
- `instagram_username`: TEXT - User's Instagram user ID

## Usage

The daily notification cron job will:
1. Fetch all users with notification preferences
2. For each user, check their `notification_method` array
3. Fetch optional content (news, quotes, challenges) based on preferences
4. Send formatted message via each selected method
5. Log results

## Testing

Test individual methods:
```typescript
// Test WhatsApp
await ChatbotService.sendWhatsApp('+1234567890', 'Test message');

// Test Telegram
await ChatbotService.sendTelegram('chat_id', 'Test message');

// Test Slack
await ChatbotService.sendSlack('U123456', 'Test message');

// Test Instagram
await ChatbotService.sendInstagram('instagram_user_id', 'Test message');
```

## Next Steps

1. Run the migration to add notification preferences
2. Set up API credentials for desired platforms
3. Update settings UI to let users configure preferences
4. Test notifications manually
5. Deploy and monitor

