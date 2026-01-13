/**
 * Chatbot Service
 * Handles sending messages via WhatsApp, Telegram, Slack, and Instagram
 * 
 * Integration guides:
 * - WhatsApp: https://developers.facebook.com/docs/whatsapp
 * - Telegram: https://core.telegram.org/bots/api
 * - Slack: https://api.slack.com/messaging
 * - Instagram: https://developers.facebook.com/docs/instagram-platform
 */

interface ChatbotMessage {
  userId: string;
  userName: string;
  quizLink: string;
  streakCount: number;
  totalXP: number;
  topics: Array<{
    name: string;
    day: number;
    link: string;
  }>;
  // Optional content
  news?: Array<{
    title: string;
    summary: string;
    source: string;
  }>;
  quote?: {
    text: string;
    author: string;
  };
  challenge?: {
    title: string;
    description: string;
  };
}

interface NotificationPreferences {
  include_news: boolean;
  include_quotes: boolean;
  include_challenge: boolean;
  news_categories: string[];
}

export class ChatbotService {
  private static readonly APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aurzomorning.replit.app';

  /**
   * Format message for different platforms
   */
  private static formatMessage(data: ChatbotMessage, preferences: NotificationPreferences): string {
    let message = `🌅 Good morning, ${data.userName}! 👋\n\n`;
    
    message += `📊 Your Stats:\n`;
    message += `🔥 Streak: ${data.streakCount} days\n`;
    message += `⭐ Total XP: ${data.totalXP}\n\n`;
    
    message += `📚 Today's Quizzes:\n`;
    data.topics.forEach((topic, idx) => {
      message += `${idx + 1}. ${topic.name} - Day ${topic.day}\n`;
      message += `   ${topic.link}\n\n`;
    });
    
    // Add optional content based on preferences
    if (preferences.include_news && data.news && data.news.length > 0) {
      message += `📰 News from the past 24 hours:\n`;
      data.news.forEach((item, idx) => {
        message += `${idx + 1}. ${item.title}\n`;
        message += `   ${item.summary}\n`;
        message += `   Source: ${item.source}\n\n`;
      });
    }
    
    if (preferences.include_quotes && data.quote) {
      message += `💭 Daily Quote:\n`;
      message += `"${data.quote.text}"\n`;
      message += `— ${data.quote.author}\n\n`;
    }
    
    if (preferences.include_challenge && data.challenge) {
      message += `🎯 Today's Challenge:\n`;
      message += `${data.challenge.title}\n`;
      message += `${data.challenge.description}\n\n`;
    }
    
    message += `⏰ Complete your quizzes today to keep your streak alive! 🚀`;
    
    return message;
  }

  /**
   * Send message via WhatsApp
   * Uses Meta WhatsApp Business API
   */
  static async sendWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const whatsappApiUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      if (!accessToken || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
        console.warn('WhatsApp credentials not configured');
        return false;
      }

      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('WhatsApp API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send message via Telegram
   * Uses Telegram Bot API
   */
  static async sendTelegram(username: string, message: string): Promise<boolean> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        console.warn('Telegram bot token not configured');
        return false;
      }

      // First, get chat_id from username (this requires the user to have started a conversation with the bot)
      // For now, we'll use a mapping table or direct chat_id if available
      // In production, you'd store chat_id when user links their Telegram
      
      const chatId = username; // This should be the chat_id, not username
      const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Telegram API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  /**
   * Send message via Slack
   * Uses Slack Web API
   */
  static async sendSlack(userId: string, message: string): Promise<boolean> {
    try {
      const slackToken = process.env.SLACK_BOT_TOKEN;
      
      if (!slackToken) {
        console.warn('Slack bot token not configured');
        return false;
      }

      const apiUrl = 'https://slack.com/api/chat.postMessage';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: userId, // This should be the Slack user ID or DM channel ID
          text: message,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        console.error('Slack API error:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      return false;
    }
  }

  /**
   * Send message via Instagram Direct Message
   * Uses Instagram Messaging API
   */
  static async sendInstagram(instagramId: string, message: string): Promise<boolean> {
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const pageId = process.env.INSTAGRAM_PAGE_ID;

      if (!accessToken || !pageId) {
        console.warn('Instagram credentials not configured');
        return false;
      }

      // Instagram Messaging API requires the user to have messaged your page first
      const apiUrl = `https://graph.facebook.com/v18.0/${pageId}/messages`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: instagramId },
          message: { text: message },
          messaging_type: 'UPDATE'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Instagram API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Instagram message:', error);
      return false;
    }
  }

  /**
   * Send daily notification to user via their preferred methods
   */
  static async sendDailyNotification(
    userId: string,
    userName: string,
    notificationMethods: string[],
    preferences: NotificationPreferences,
    data: ChatbotMessage
  ): Promise<{ method: string; success: boolean }[]> {
    const results: { method: string; success: boolean }[] = [];
    const message = this.formatMessage(data, preferences);

    for (const method of notificationMethods) {
      let success = false;

      switch (method) {
        case 'whatsapp':
          if (data.userId) {
            // WhatsApp phone number should be stored in user profile
            // For now, we'll need to fetch it from the database
            // This is a placeholder - you'd need to fetch the phone number
            success = false; // Placeholder
          }
          break;

        case 'telegram':
          if (data.userId) {
            // Telegram chat_id should be stored in user profile
            success = false; // Placeholder
          }
          break;

        case 'slack':
          if (data.userId) {
            // Slack user ID should be stored in user profile
            success = false; // Placeholder
          }
          break;

        case 'instagram':
          if (data.userId) {
            // Instagram user ID should be stored in user profile
            success = false; // Placeholder
          }
          break;

        case 'email':
          // Email is handled separately by EmailService
          success = true;
          break;

        default:
          console.warn(`Unknown notification method: ${method}`);
      }

      results.push({ method, success });
    }

    return results;
  }
}

