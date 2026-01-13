import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface User {
  id: string;
  email: string;
  first_name: string | null;
  timezone: string;
  reminders_enabled: boolean;
}

const buildDailyEmailHtml = (
  name: string,
  streakCount: number,
  totalXP: number,
  userTopics: Array<{
    topic_id: string;
    current_day: number;
    unlock_day?: number;
    topics: { name: string };
  }>
) => {
  const APP_URL = Deno.env.get('APP_URL') || 'https://aurzomorning.replit.app';
  
  const topicsHTML = userTopics.map(ut => {
    const day = ut.unlock_day || ut.current_day;
    return `
      <div style="margin-bottom: 16px; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${ut.topics.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Day ${day} • 2 minutes</p>
          </div>
          <a href="${APP_URL}/quiz/${ut.topic_id}/${day}" 
             style="background: linear-gradient(135deg, #f97316, #9333ea); color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Start Quiz →
          </a>
        </div>
      </div>
    `;
  }).join('');

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
        <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">Good morning, ${name}! 👋</h1>
        <p style="color: #6b7280; margin: 0;">Your daily quizzes are ready. Let's make today count.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
        <div style="background: linear-gradient(135deg, #fed7aa, #fdba74); padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #c2410c;">${streakCount}</div>
          <div style="font-size: 14px; color: #9a3412;">Day Streak</div>
        </div>
        <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #d97706;">${totalXP}</div>
          <div style="font-size: 14px; color: #92400e;">Total XP</div>
        </div>
      </div>

      ${userTopics.length > 0 ? `
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Today's Quizzes</h2>
        ${topicsHTML}
      </div>
      ` : ''}

      <div style="background: linear-gradient(135deg, #f97316, #9333ea); color: white; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
        <div style="font-size: 24px; margin-bottom: 8px;">⏰</div>
        <p style="font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">Complete them today to keep your streak alive!</p>
        <a href="${APP_URL}/overview" 
           style="display: inline-block; background: white; color: #f97316; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 12px;">
          Go to Dashboard →
        </a>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Daily Quiz • Learn something new every day</p>
        <p style="margin: 8px 0 0 0;">
          <a href="${APP_URL}/overview" style="color: #f97316; text-decoration: none;">Update Preferences</a>
        </p>
      </div>
    </body>
  </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // 1. Fetch users with email notifications enabled
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        auth_id,
        email,
        first_name,
        full_name,
        timezone,
        reminders_enabled,
        streak_count,
        total_xp,
        user_topics (
          topic_id,
          current_day,
          unlock_day,
          topics (
            name
          )
        )
      `);

    if (error) throw error;

    // 2. Fetch user preferences to check notification settings
    const authIds = (users || []).map(u => u.auth_id).filter(Boolean);
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('user_id, notification_settings')
      .in('user_id', authIds);

    const prefMap = new Map(preferences?.map(p => [p.user_id, p.notification_settings]) || []);

    const emailsToSend = [];

    // 3. Filter users where it is 7 AM and email is enabled
    const now = new Date();
    console.log(`Checking time for ${users?.length ?? 0} users at UTC: ${now.toISOString()}`);

    for (const user of users || []) {
      if (!user.timezone) continue;

      // Check if email notifications are enabled
      const settings = prefMap.get(user.auth_id) as any;
      const methods = settings?.notification_method || [];
      const shouldEmail = methods.includes('email');

      if (!shouldEmail) {
        console.log(`Skipping user ${user.id} (email not enabled)`);
        continue;
      }

      try {
        const userTime = new Date(now.toLocaleString("en-US", { timeZone: user.timezone }));
        const hour = userTime.getHours();

        // Check if it's 7 AM (or close to it if running hourly)
        // Since cron runs at minute 0, checking hour === 7 is correct.
        if (hour === 7) {
          emailsToSend.push(user);
        }
      } catch (e) {
        console.error(`Error checking time for user ${user.id} with timezone ${user.timezone}:`, e);
      }
    }

    console.log(`Found ${emailsToSend.length} users to email.`);

    // 4. Send emails
    const results = await Promise.allSettled(
      emailsToSend.map(async (user) => {
        const userName = user.full_name || user.first_name || "there";
        const html = buildDailyEmailHtml(
          userName,
          user.streak_count || 0,
          user.total_xp || 0,
          user.user_topics || []
        );

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Morning Loop <onboarding@resend.dev>", // Update with verified domain if available
            to: [user.email],
            subject: `Day ${(user.streak_count || 0) + 1} awaits! Your daily quizzes are ready 🌅`,
            html: html,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Resend API error: ${text}`);
        }

        const emailResult = await res.json();
        
        // Log message to database
        try {
          await supabase
            .from('message_logs')
            .insert({
              user_id: user.id,
              message_type: 'email',
              recipient: user.email,
              subject: `Day ${(user.streak_count || 0) + 1} awaits! Your daily quizzes are ready 🌅`,
              message_body: html.substring(0, 10000), // Truncate HTML if too long
              status: 'sent',
              external_message_id: emailResult.id || null,
              sent_at: new Date().toISOString(),
              metadata: {
                topics_count: (user.user_topics || []).length,
                streak_count: user.streak_count || 0,
                total_xp: user.total_xp || 0,
                email_provider: 'resend'
              }
            })
        } catch (logError) {
          console.error(`Error logging email for user ${user.id}:`, logError)
          // Don't fail the whole process if logging fails
        }

        return emailResult;
      })
    );

    // Log failed emails
    results.forEach((result, index) => {
      if (result.status === 'rejected' && emailsToSend[index]) {
        const user = emailsToSend[index];
        supabase
          .from('message_logs')
          .insert({
            user_id: user.id,
            message_type: 'email',
            recipient: user.email,
            subject: `Day ${(user.streak_count || 0) + 1} awaits! Your daily quizzes are ready 🌅`,
            message_body: '',
            status: 'failed',
            error_message: result.reason?.message || 'Unknown error',
            metadata: {
              error: result.reason
            }
          })
          .catch(err => console.error(`Error logging failed email for user ${user.id}:`, err));
      }
    });

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        message: `Processed ${users?.length} users. Sent ${successful} emails. Failed ${failed}.`,
        details: { successful, failed },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
