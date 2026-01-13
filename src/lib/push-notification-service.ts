/**
 * Push Notification Service
 * Sends iOS push notifications via Apple Push Notification Service (APNs)
 * 
 * This is the official way to send notifications to iOS devices.
 * Users receive notifications that look similar to iMessages.
 * 
 * Setup:
 * 1. Create an Apple Developer account
 * 2. Generate APNs keys or certificates
 * 3. Set up push notification service
 * 4. Users need to install your app/PWA and grant notification permissions
 */

interface PushNotificationData {
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
  news?: Array<{
    title: string;
    summary: string;
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
}

export class PushNotificationService {
  /**
   * Format notification payload for iOS
   */
  private static formatNotification(
    data: PushNotificationData,
    preferences: NotificationPreferences
  ): { title: string; body: string; data?: any } {
    const title = `🌅 Good morning, ${data.userName}!`;
    
    let body = `📚 ${data.topics.length} quiz${data.topics.length > 1 ? 'es' : ''} ready! `;
    body += `🔥 ${data.streakCount} day streak`;
    
    // Add optional content preview
    if (preferences.include_quotes && data.quote) {
      body += ` • 💭 "${data.quote.text.substring(0, 30)}..."`;
    }
    
    if (preferences.include_challenge && data.challenge) {
      body += ` • 🎯 ${data.challenge.title}`;
    }

    // Notification data payload (for deep linking)
    const notificationData = {
      type: 'daily_quiz',
      quizLink: data.quizLink,
      topics: data.topics.map(t => ({
        name: t.name,
        day: t.day,
        link: t.link
      })),
      streakCount: data.streakCount,
      totalXP: data.totalXP
    };

    return {
      title,
      body,
      data: notificationData
    };
  }

  /**
   * Send push notification via APNs
   * Requires: Device token, APNs key/certificate
   */
  static async sendiOSPush(
    deviceToken: string,
    notification: { title: string; body: string; data?: any }
  ): Promise<boolean> {
    try {
      // APNs endpoint (production or sandbox)
      const apnsUrl = process.env.APNS_PRODUCTION === 'true'
        ? 'https://api.push.apple.com'
        : 'https://api.sandbox.push.apple.com';

      const keyId = process.env.APNS_KEY_ID;
      const teamId = process.env.APNS_TEAM_ID;
      const bundleId = process.env.APNS_BUNDLE_ID || 'com.morninggrowthloop.app';
      
      // APNs uses JWT authentication
      // You'll need to generate a JWT token using your APNs key
      // This is a simplified version - you'd use a library like 'jsonwebtoken'
      
      const payload = {
        aps: {
          alert: {
            title: notification.title,
            body: notification.body
          },
          sound: 'default',
          badge: 1,
          'content-available': 1,
          'mutable-content': 1
        },
        ...notification.data
      };

      // For now, this is a placeholder
      // You'd need to:
      // 1. Generate JWT token with APNs key
      // 2. Make authenticated request to APNs
      // 3. Handle device token registration in your database
      
      console.log('Would send iOS push notification:', {
        deviceToken: deviceToken.substring(0, 20) + '...',
        title: notification.title,
        body: notification.body
      });

      // Example with proper JWT (requires 'jsonwebtoken' library):
      /*
      const jwt = require('jsonwebtoken');
      const fs = require('fs');
      
      const key = fs.readFileSync(process.env.APNS_KEY_PATH);
      const token = jwt.sign({}, key, {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: keyId
        },
        issuer: teamId,
        expiresIn: '1h'
      });

      const response = await fetch(`${apnsUrl}/3/device/${deviceToken}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'apns-topic': bundleId,
          'apns-priority': '10',
          'apns-push-type': 'alert'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
      */

      return true; // Placeholder
    } catch (error) {
      console.error('Error sending iOS push notification:', error);
      return false;
    }
  }

  /**
   * Alternative: Web Push Notifications (PWA)
   * Works on iOS Safari 16.4+ and all modern browsers
   * This is easier to set up than native APNs
   */
  static async sendWebPush(
    subscription: PushSubscription,
    notification: { title: string; body: string; data?: any }
  ): Promise<boolean> {
    try {
      // Web Push uses VAPID (Voluntary Application Server Identification)
      // This works on iOS Safari 16.4+ and all modern browsers
      
      const webPush = require('web-push'); // npm install web-push
      
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidEmail = process.env.VAPID_EMAIL || 'mailto:notifications@morning-growth-loop.com';

      webPush.setVapidDetails(
        vapidEmail,
        vapidPublicKey,
        vapidPrivateKey
      );

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: notification.data,
        url: notification.data?.quizLink || '/dashboard'
      });

      await webPush.sendNotification(subscription, payload);
      
      return true;
    } catch (error) {
      console.error('Error sending web push notification:', error);
      return false;
    }
  }
}

