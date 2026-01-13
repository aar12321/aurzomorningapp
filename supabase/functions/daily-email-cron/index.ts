import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  preferences?: {
    include_news: boolean;
    include_quotes: boolean;
    include_challenge: boolean;
    news_categories: string[];
  };
  news?: Array<{
    title: string;
    summary: string;
    source: string;
  }>;
  quote?: {
    text: string;
    author?: string;
  };
  challenge?: {
    title: string;
    description: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting daily email cron job...')

    // Get all active users with their topics
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select(`
        id,
        auth_id,
        full_name,
        email,
        streak_count,
        total_xp,
        user_topics (
          topic_id,
          current_day,
          topics (
            name
          )
        )
      `)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(JSON.stringify({ error: usersError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!users || users.length === 0) {
      console.log('No users found for daily emails')
      return new Response(JSON.stringify({ message: 'No users found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch preferences for these users
    const authIds = users.map(u => u.auth_id).filter(Boolean);
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('user_id, notification_settings')
      .in('user_id', authIds);

    const prefMap = new Map(preferences?.map(p => [p.user_id, p.notification_settings]) || []);

    console.log(`Found ${users.length} users. Checking preferences...`)

    // Process each user
    const emailResults = []
    for (const user of users) {
      // Check preferences
      const settings = prefMap.get(user.auth_id) as any;
      const methods = settings?.notification_method || []; // Default to empty if not set? Or ['email']?
      // If no preferences set, maybe default to email? Or safer to skip.
      // Based on migration, we have defaults.

      const shouldEmail = methods.includes('email');

      if (!shouldEmail) {
        console.log(`Skipping user ${user.id} (email not enabled)`);
        continue;
      }

      try {
        const notificationPrefs = settings?.notification_preferences || {
          include_news: false,
          include_quotes: false,
          include_challenge: false,
          news_categories: ['general']
        };

        // Fetch optional content based on preferences
        let news: Array<{ title: string; summary: string; source: string }> | null = null;
        let quote: { text: string; author?: string } | null = null;
        let challenge: { title: string; description: string } | null = null;

        if (notificationPrefs.include_news) {
          try {
            const newsApiKey = Deno.env.get('NEWS_API_KEY');
            if (newsApiKey) {
              const newsResponse = await fetch(
                `https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}&pageSize=3`
              );
              if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                news = newsData.articles?.slice(0, 3).map((article: any) => ({
                  title: article.title,
                  summary: article.description || article.title,
                  source: article.source?.name || 'Unknown'
                })) || [];
              }
            }
          } catch (e) {
            console.error('Error fetching news:', e);
          }
        }

        if (notificationPrefs.include_quotes) {
          try {
            // Try to get today's quote from database (shared quote)
            const { data: dailyQuote } = await supabaseClient
              .from('daily_quotes')
              .select('quote_text, author')
              .eq('date', new Date().toISOString().split('T')[0])
              .maybeSingle();

            if (dailyQuote) {
              quote = {
                text: dailyQuote.quote_text,
                author: dailyQuote.author || undefined
              };
            } else {
              // Fallback to API
              const quoteResponse = await fetch('https://api.quotable.io/random?tags=motivational');
              if (quoteResponse.ok) {
                const quoteData = await quoteResponse.json();
                quote = {
                  text: quoteData.content,
                  author: quoteData.author
                };
              }
            }
          } catch (e) {
            console.error('Error fetching quote:', e);
          }
        }

        if (notificationPrefs.include_challenge) {
          const challenges = [
            {
              title: 'Speed Challenge',
              description: 'Complete all your quizzes in under 5 minutes total today!'
            },
            {
              title: 'Perfect Score Challenge',
              description: 'Try to get a perfect score on at least one quiz today.'
            },
            {
              title: 'Consistency Challenge',
              description: 'Complete all your quizzes before noon today!'
            }
          ];
          challenge = challenges[Math.floor(Math.random() * challenges.length)];
        }

        const emailData: EmailData = {
          userId: user.id,
          userName: user.full_name,
          streakCount: user.streak_count || 0,
          totalXP: user.total_xp || 0,
          topics: user.user_topics?.map(ut => ({
            id: ut.topic_id,
            name: ut.topics.name,
            day: ut.current_day,
            completed: false // This would be checked against quiz_attempts
          })) || [],
          preferences: notificationPrefs,
          news: news || undefined,
          quote: quote || undefined,
          challenge: challenge || undefined
        }

        // Generate and send email (REAL implementation)
        const emailSent = await sendDailyEmail(user.email, emailData)
        emailResults.push({
          userId: user.id,
          email: user.email,
          success: emailSent
        })

        console.log(`Processed email for user ${user.id} (${user.email})`)
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        emailResults.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = emailResults.filter(r => r.success).length
    console.log(`Daily email cron completed: ${successCount}/${emailResults.length} sent`)

    return new Response(JSON.stringify({
      message: 'Daily emails processed',
      totalUsers: users.length,
      emailsSent: successCount,
      results: emailResults
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Daily email cron error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendDailyEmail(email: string, data: EmailData): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Morning Loop <onboarding@resend.dev>',
        to: email,
        subject: `Day ${data.streakCount + 1} awaits! Your daily quizzes are ready 🌅`,
        html: generateEmailHTML(data)
      })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    return false;
  }
}

function generateEmailHTML(data: EmailData): string {
  const topicsHTML = data.topics.map(topic => `
    <div style="margin-bottom: 16px; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${topic.name}</h3>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Day ${topic.day} • 2 minutes</p>
        </div>
        <a href="${Deno.env.get('APP_URL') || 'https://aurzomorning.replit.app'}/quiz/${topic.id}/${topic.day}" 
           style="background: linear-gradient(135deg, #f97316, #9333ea); color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Start Quiz →
        </a>
      </div>
    </div>
  `).join('')

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
          <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">Good morning, ${data.userName}! 👋</h1>
          <p style="color: #6b7280; margin: 0;">Your daily quizzes are ready. Let's make today count.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #fed7aa, #fdba74); padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #c2410c;">${data.streakCount}</div>
            <div style="font-size: 14px; color: #9a3412;">Day Streak</div>
          </div>
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #d97706;">${data.totalXP}</div>
            <div style="font-size: 14px; color: #92400e;">Total XP</div>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Today's Quizzes</h2>
          ${topicsHTML}
        </div>

        ${data.news && data.news.length > 0 ? `
        <div style="margin-bottom: 32px; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">📰 News from the Past 24 Hours</h2>
          ${data.news.map((item, idx) => `
            <div style="margin-bottom: ${idx < data.news.length - 1 ? '16px' : '0'}; padding-bottom: ${idx < data.news.length - 1 ? '16px' : '0'}; border-bottom: ${idx < data.news.length - 1 ? '1px solid #e5e7eb' : 'none'};">
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${item.title}</h3>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">${item.summary}</p>
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">Source: ${item.source}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.quote ? `
        <div style="margin-bottom: 32px; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="font-size: 18px; font-style: italic; color: #92400e; margin: 0 0 8px 0;">"${data.quote.text}"</p>
          ${data.quote.author ? `<p style="font-size: 14px; color: #78350f; margin: 0; text-align: right;">— ${data.quote.author}</p>` : ''}
        </div>
        ` : ''}

        ${data.challenge ? `
        <div style="margin-bottom: 32px; padding: 20px; background: linear-gradient(135deg, #fed7aa, #fdba74); border-radius: 8px; border-left: 4px solid #f97316;">
          <h2 style="font-size: 18px; font-weight: 600; color: #c2410c; margin: 0 0 8px 0;">🎯 Today's Challenge</h2>
          <h3 style="font-size: 16px; font-weight: 600; color: #9a3412; margin: 0 0 4px 0;">${data.challenge.title}</h3>
          <p style="font-size: 14px; color: #7c2d12; margin: 0;">${data.challenge.description}</p>
        </div>
        ` : ''}

        <div style="background: linear-gradient(135deg, #f97316, #9333ea); color: white; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 24px; margin-bottom: 8px;">⏰</div>
          <p style="font-size: 18px; font-weight: 500; margin: 0 0 8px 0;">Complete them today to keep your streak alive!</p>
          <a href="${Deno.env.get('APP_URL') || 'https://aurzomorning.replit.app'}/overview" 
             style="display: inline-block; background: white; color: #f97316; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 12px;">
            Go to Dashboard →
          </a>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Daily Quiz • Learn something new every day</p>
          <p style="margin: 8px 0 0 0;">
            <a href="${Deno.env.get('APP_URL') || 'https://aurzomorning.replit.app'}/overview" style="color: #f97316; text-decoration: none;">Update Preferences</a>
          </p>
        </div>
      </body>
    </html>
  `
}
