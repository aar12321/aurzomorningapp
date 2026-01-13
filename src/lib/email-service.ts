import { supabase } from "@/integrations/supabase/client";

interface EmailData {
  userId: string;
  userName: string;
  topics: Array<{
    id: string;
    name: string;
    day: number;
    completed: boolean;
  }>;
  streakCount: number;
  totalXP: number;
}

export class EmailService {
  private static async getUsersForDailyEmail(): Promise<EmailData[]> {
    try {
      // Get all users with their topics and current progress
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          streak_count,
          total_xp,
          user_topics (
            topic_id,
            current_day,
            topics (
              name
            )
          )
        `);

      if (error) throw error;

      return users?.map(user => ({
        userId: user.id,
        userName: user.full_name,
        streakCount: user.streak_count || 0,
        totalXP: user.total_xp || 0,
        topics: user.user_topics?.map(ut => ({
          id: ut.topic_id,
          name: ut.topics.name,
          day: ut.current_day,
          completed: false // This would be checked against quiz_attempts
        })) || []
      })) || [];
    } catch (error) {
      console.error('Error fetching users for daily email:', error);
      return [];
    }
  }

  static async sendDailyEmails(): Promise<void> {
    try {
      const users = await this.getUsersForDailyEmail();
      
      for (const user of users) {
        await this.sendDailyEmailToUser(user);
      }
      
      console.log(`Sent daily emails to ${users.length} users`);
    } catch (error) {
      console.error('Error sending daily emails:', error);
    }
  }

  private static async sendDailyEmailToUser(user: EmailData): Promise<void> {
    try {
      // This would integrate with an email service like Resend, SendGrid, or Postmark
      // For now, we'll just log the email data
      console.log('Sending daily email to:', {
        to: user.userId,
        subject: `Your Daily Quizzes Are Ready!`,
        template: 'daily-quiz',
        data: user
      });

      // Example integration with Resend:
      /*
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Daily Quiz <noreply@dailyquiz.com>',
          to: [user.email],
          subject: 'Your Daily Quizzes Are Ready!',
          html: this.generateEmailHTML(user),
        }),
      });

      if (!response.ok) {
        throw new Error(`Email failed: ${response.statusText}`);
      }
      */
    } catch (error) {
      console.error(`Error sending email to user ${user.userId}:`, error);
    }
  }

  private static generateEmailHTML(user: EmailData): string {
    const topicsHTML = user.topics.map(topic => `
      <div style="margin-bottom: 16px; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${topic.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Day ${topic.day} • 2 minutes</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/quiz/${topic.id}/${topic.day}" 
             style="background: linear-gradient(135deg, #f97316, #9333ea); color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Start Quiz →
          </a>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Daily Quizzes Are Ready!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f97316, #9333ea); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <span style="color: white; font-size: 24px;">🌅</span>
            </div>
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">Good morning, ${user.userName}! 👋</h1>
            <p style="color: #6b7280; margin: 0;">Your daily quizzes are ready. Let's make today count.</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
            <div style="background: linear-gradient(135deg, #fed7aa, #fdba74); padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #c2410c;">${user.streakCount}</div>
              <div style="font-size: 14px; color: #9a3412;">Day Streak</div>
            </div>
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #d97706;">${user.totalXP}</div>
              <div style="font-size: 14px; color: #92400e;">Total XP</div>
            </div>
          </div>

          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Today's Quizzes</h2>
            ${topicsHTML}
          </div>

          <div style="background: linear-gradient(135deg, #f97316, #9333ea); color: white; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
            <div style="font-size: 24px; margin-bottom: 8px;">⏰</div>
            <p style="font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">Complete them today to keep your streak alive!</p>
            <p style="font-size: 14px; opacity: 0.9; margin: 0;">Next day unlocks in 13h 47m</p>
          </div>

          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Daily Quiz • Learn something new every day</p>
            <p style="margin: 8px 0 0 0;">
              <a href="#" style="color: #f97316; text-decoration: none;">Unsubscribe</a> • 
              <a href="#" style="color: #f97316; text-decoration: none; margin-left: 8px;">Update Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  // Method to schedule daily emails (would be called by a cron job)
  static async scheduleDailyEmails(): Promise<void> {
    // This would typically be set up as a cron job that runs at 7:00 AM ET
    // For example, using Vercel Cron or QStash
    
    console.log('Scheduling daily emails for 7:00 AM ET...');
    
    // Example with QStash:
    /*
    const response = await fetch('https://qstash.upstash.io/v2/schedules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/daily-emails`,
        cron: '0 7 * * *', // 7:00 AM ET daily
      }),
    });
    */
  }
}

