// @ts-ignore - Deno URL imports are resolved at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno URL imports are resolved at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserNotificationData {
  userId: string;
  userName: string;
  email: string;
  notificationMethods: string[];
  preferences: {
    include_news: boolean;
    include_quotes: boolean;
    include_challenge: boolean;
    news_categories: string[];
  };
  whatsappNumber?: string;
  telegramUsername?: string;
  slackUserId?: string;
  instagramUsername?: string;
  streakCount: number;
  totalXP: number;
  topics: Array<{
    topicId: string;
    name: string;
    day: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting daily notifications cron job...')

    // Get all users with their topics
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
          unlock_day,
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
      console.log('No users found for daily notifications')
      return new Response(JSON.stringify({ message: 'No users found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${users.length} users for daily notifications`)

    // Fetch user preferences for all users
    const authIds = users.map(u => u.auth_id).filter(Boolean);
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('user_id, notification_settings, phone_number')
      .in('user_id', authIds);

    const prefMap = new Map(preferences?.map(p => [p.user_id, p]) || []);

    const APP_URL = Deno.env.get('APP_URL') || 'https://aurzomorning.replit.app'
    const results: Array<{
      userId: string;
      method: string;
      success: boolean;
      message?: string;
      error?: string;
    }> = []

    for (const user of users) {
      try {
        const userPref = prefMap.get(user.auth_id);
        const settings = userPref?.notification_settings as any;
        const notificationMethods = settings?.notification_method || []
        const preferences = settings?.notification_preferences || {
          include_news: false,
          include_quotes: false,
          include_challenge: false,
          news_categories: ['general']
        }
        const whatsappNumber = userPref?.phone_number || null

        // Filter topics that are unlocked today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const availableTopics = user.user_topics?.filter(ut => {
          const unlockDay = ut.unlock_day || 1
          const currentDay = ut.current_day || 1
          return unlockDay >= currentDay
        }) || []

        if (availableTopics.length === 0) {
          console.log(`No available quizzes for user ${user.id}`)
          continue
        }

        // Build quiz links - use unlock_day for the quiz link (this is the day that's unlocked)
        const topics = availableTopics.map(ut => ({
          topicId: ut.topic_id,
          name: ut.topics.name,
          day: ut.unlock_day || 1, // Use unlock_day as the day number for the quiz
          link: `${APP_URL}/quiz/${ut.topic_id}/${ut.unlock_day || 1}`
        }))

        // Fetch optional content
        let news: Array<{ title: string; summary: string; source: string }> | null = null
        let quote: { text: string; author: string } | null = null
        let challenge: { title: string; description: string } | null = null

        if (preferences.include_news) {
          // Fetch news via API
          try {
            const newsResponse = await fetch(
              `https://newsapi.org/v2/top-headlines?country=us&apiKey=${Deno.env.get('NEWS_API_KEY')}&pageSize=3`
            )
            if (newsResponse.ok) {
              const newsData = await newsResponse.json()
              news = newsData.articles?.slice(0, 3).map((article: any) => ({
                title: article.title,
                summary: article.description || article.title,
                source: article.source?.name || 'Unknown'
              })) || []
            }
          } catch (e) {
            console.error('Error fetching news:', e)
          }
        }

        if (preferences.include_quotes) {
          try {
            // Try multiple quote APIs as fallback
            let quoteFetched = false
            
            // Try quotable.io first
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
              const quoteResponse = await fetch('https://api.quotable.io/random?tags=motivational', {
                signal: controller.signal
              })
              clearTimeout(timeoutId)
              if (quoteResponse.ok) {
                const quoteData = await quoteResponse.json()
                quote = {
                  text: quoteData.content,
                  author: quoteData.author
                }
                quoteFetched = true
              }
            } catch (e) {
              // Silently fail and try fallback - don't log as error since we have fallbacks
              console.log('Quotable.io unavailable, using fallback')
            }
            
            // Fallback to a simple quote API or use a default quote
            if (!quoteFetched) {
              try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
                const fallbackResponse = await fetch('https://zenquotes.io/api/random', {
                  signal: controller.signal
                })
                clearTimeout(timeoutId)
                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json()
                  if (fallbackData && fallbackData[0]) {
                    quote = {
                      text: fallbackData[0].q,
                      author: fallbackData[0].a
                    }
                    quoteFetched = true
                  }
                }
              } catch (e) {
                console.log('Fallback quote API failed:', e.message)
              }
            }
            
            // If all APIs fail, use a default motivational quote
            if (!quoteFetched) {
              const defaultQuotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
                { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" }
              ]
              const randomQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)]
              quote = randomQuote
              console.log('Using default quote due to API failures')
            }
          } catch (e) {
            // All quote APIs failed, use default - this is expected and handled gracefully
            console.log('All quote APIs failed, using default quote')
            quote = {
              text: "Every day is a new beginning. Take a deep breath and start again.",
              author: "Unknown"
            }
          }
        }

        if (preferences.include_challenge) {
          const challenges = [
            {
              title: 'Speed Challenge',
              description: 'Complete all your quizzes in under 5 minutes total today!'
            },
            {
              title: 'Perfect Score Challenge',
              description: 'Try to get a perfect score on at least one quiz today.'
            }
          ]
          challenge = challenges[Math.floor(Math.random() * challenges.length)]
        }

        // Format message
        let message = `🌅 Good morning, ${user.full_name}! 👋\n\n`
        message += `📊 Your Stats:\n`
        message += `🔥 Streak: ${user.streak_count || 0} days\n`
        message += `⭐ Total XP: ${user.total_xp || 0}\n\n`
        message += `📚 Today's Quizzes:\n`
        topics.forEach((topic, idx) => {
          message += `${idx + 1}. ${topic.name} - Day ${topic.day}\n`
          message += `   ${topic.link}\n\n`
        })

        if (news && news.length > 0) {
          message += `📰 News from the past 24 hours:\n`
          news.forEach((item: any, idx: number) => {
            message += `${idx + 1}. ${item.title}\n`
            message += `   ${item.summary}\n`
            message += `   Source: ${item.source}\n\n`
          })
        }

        if (quote) {
          message += `💭 Daily Quote:\n`
          message += `"${quote.text}"\n`
          message += `— ${quote.author}\n\n`
        }

        if (challenge) {
          message += `🎯 Today's Challenge:\n`
          message += `${challenge.title}\n`
          message += `${challenge.description}\n\n`
        }

        message += `⏰ Complete your quizzes today to keep your streak alive! 🚀`

        // Send via each notification method
        for (const method of notificationMethods) {
          let success = false

          switch (method) {
            case 'whatsapp':
              if (whatsappNumber) {
                try {
                  const whatsappApiUrl = `https://graph.facebook.com/v18.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`
                  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

                  if (!accessToken || !Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')) {
                    console.error(`WhatsApp credentials not configured for user ${user.id}`)
                    success = false
                  } else {
                    // Format phone number: keep + and digits only (E.164 format)
                    // Remove spaces, dashes, parentheses but keep + and digits
                    let phoneNumber = whatsappNumber.replace(/[^\d+]/g, '')
                    // Ensure it starts with + (if not, add country code - assumes US if missing)
                    if (!phoneNumber.startsWith('+')) {
                      // If it's 10 digits, assume US (+1)
                      if (phoneNumber.length === 10) {
                        phoneNumber = '+1' + phoneNumber
                      } else {
                        // Otherwise, try to add +1 (you may need to adjust this based on your users)
                        phoneNumber = '+' + phoneNumber
                      }
                    }
                    
                    // WhatsApp has a 4096 character limit for text messages
                    // Truncate if needed and add a note
                    let whatsappMessage = message
                    const WHATSAPP_MAX_LENGTH = 4096
                    if (whatsappMessage.length > WHATSAPP_MAX_LENGTH) {
                      whatsappMessage = whatsappMessage.substring(0, WHATSAPP_MAX_LENGTH - 50)
                      whatsappMessage += '\n\n[Message truncated due to length limit]'
                      console.warn(`WhatsApp message truncated for user ${user.id} (${message.length} → ${whatsappMessage.length} chars)`)
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
                        text: { body: whatsappMessage }
                      }),
                    })

                    const responseText = await response.text()
                    let responseData
                    try {
                      responseData = JSON.parse(responseText)
                    } catch {
                      responseData = { raw: responseText }
                    }

                    if (!response.ok) {
                      const errorCode = responseData?.error?.code
                      const errorMessage = responseData?.error?.message || responseText
                      
                      // Handle specific error cases
                      if (errorCode === 131030) {
                        // Phone number not in allowed list (test mode)
                        console.error(`WhatsApp: Phone number ${phoneNumber} not in allowed list for user ${user.id}. Add it in Meta Dashboard → WhatsApp → API Setup → Recipients`)
                      } else if (errorCode === 131047 || errorMessage.includes('24 hour')) {
                        // Outside 24-hour messaging window - need template message
                        console.error(`WhatsApp: Outside 24-hour window for user ${user.id}. Need to use template messages or complete business verification.`)
                      } else {
                        console.error(`WhatsApp API error for user ${user.id}:`, errorMessage, `(Code: ${errorCode})`)
                      }
                      success = false
                    } else {
                      // Check if WhatsApp actually accepted the message
                      const messageId = responseData?.messages?.[0]?.id
                      if (messageId) {
                        console.log(`✓ WhatsApp sent successfully to ${phoneNumber} (user ${user.id}). Message ID: ${messageId}`)
                        success = true
                      } else {
                        // Response was OK but no message ID - log full response for debugging
                        const errorMsg = `Response OK but no message ID. Check if phone number is in allowed list or if business verification is needed.`
                        console.error(`⚠ WhatsApp response OK but no message ID for ${phoneNumber} (user ${user.id}). Full response:`, JSON.stringify(responseData, null, 2))
                        console.error(`⚠ ${errorMsg}`)
                        success = false
                        errorDetails = errorMsg
                      }
                    } else {
                      const errorCode = responseData?.error?.code
                      const errorMsg = responseData?.error?.message || responseText
                      errorDetails = `Error ${errorCode}: ${errorMsg}`
                    }
                  }
                } catch (error) {
                  console.error(`Error sending WhatsApp to user ${user.id}:`, error)
                  success = false
                  errorDetails = error.message || 'Unknown error'
                }
              } else {
                console.log(`User ${user.id} has WhatsApp enabled but no phone number`)
                success = false
              }
              break

            case 'telegram':
              if (user.telegram_username) {
                try {
                  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
                  if (!botToken) {
                    console.error(`Telegram bot token not configured for user ${user.id}`)
                    success = false
                  } else {
                    // Note: Telegram requires chat_id, not username. 
                    // Users need to start a conversation with the bot first.
                    // For now, we'll try using username as chat_id (may need adjustment)
                    const chatId = user.telegram_username
                    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
                    
                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'Markdown'
                      })
                    })
                    
                    const result = await response.json()
                    if (result.ok) {
                      console.log(`✓ Telegram sent successfully to ${chatId} (user ${user.id})`)
                      success = true
                      externalMessageId = result.result?.message_id?.toString() || null
                    } else {
                      console.error(`Telegram API error for user ${user.id}:`, result.description)
                      success = false
                      errorDetails = result.description || 'Unknown Telegram error'
                    }
                  }
                } catch (error) {
                  console.error(`Error sending Telegram to user ${user.id}:`, error)
                  success = false
                }
              } else {
                console.log(`User ${user.id} has Telegram enabled but no username`)
                success = false
              }
              break

            case 'slack':
              if (user.slack_user_id) {
                try {
                  const slackToken = Deno.env.get('SLACK_BOT_TOKEN')
                  if (!slackToken) {
                    console.error(`Slack bot token not configured for user ${user.id}`)
                    success = false
                  } else {
                    const apiUrl = 'https://slack.com/api/chat.postMessage'
                    
                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${slackToken}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        channel: user.slack_user_id, // Should be Slack user ID or DM channel ID
                        text: message
                      })
                    })
                    
                    const result = await response.json()
                    if (result.ok) {
                      console.log(`✓ Slack sent successfully to ${user.slack_user_id} (user ${user.id})`)
                      success = true
                      externalMessageId = result.ts || null
                    } else {
                      console.error(`Slack API error for user ${user.id}:`, result.error)
                      success = false
                      errorDetails = result.error || 'Unknown Slack error'
                    }
                  }
                } catch (error) {
                  console.error(`Error sending Slack to user ${user.id}:`, error)
                  success = false
                }
              } else {
                console.log(`User ${user.id} has Slack enabled but no user ID`)
                success = false
              }
              break

            case 'instagram':
              if (user.instagram_username) {
                try {
                  const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
                  const pageId = Deno.env.get('INSTAGRAM_PAGE_ID')
                  
                  if (!accessToken || !pageId) {
                    console.error(`Instagram credentials not configured for user ${user.id}`)
                    success = false
                  } else {
                    // Instagram Messaging API requires user to have messaged your page first
                    // Note: This requires Instagram Business Account and proper setup
                    const apiUrl = `https://graph.facebook.com/v18.0/${pageId}/messages`
                    
                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        recipient: { id: user.instagram_username }, // Should be Instagram user ID
                        message: { text: message },
                        messaging_type: 'UPDATE' // Or 'MESSAGE_TAG' for specific use cases
                      })
                    })
                    
                    const result = await response.json()
                    if (result.message_id) {
                      console.log(`✓ Instagram sent successfully to ${user.instagram_username} (user ${user.id})`)
                      success = true
                      externalMessageId = result.message_id || null
                    } else {
                      const errorMsg = result.error?.message || JSON.stringify(result)
                      console.error(`Instagram API error for user ${user.id}:`, errorMsg)
                      success = false
                      errorDetails = errorMsg
                    }
                  }
                } catch (error) {
                  console.error(`Error sending Instagram to user ${user.id}:`, error)
                  success = false
                }
              } else {
                console.log(`User ${user.id} has Instagram enabled but no username`)
                success = false
              }
              break

            case 'email':
              // Email is handled by separate email service
              success = true
              break
          }

          // Log message to database for all methods
          try {
            const recipient = method === 'whatsapp' ? whatsappNumber || '' : 
                            method === 'telegram' ? user.telegram_username || '' :
                            method === 'slack' ? user.slack_user_id || '' :
                            method === 'instagram' ? user.instagram_username || '' :
                            user.email;

            // externalMessageId and errorDetails are captured above in each method handler

            await supabaseClient
              .from('message_logs')
              .insert({
                user_id: user.id,
                message_type: method,
                recipient: recipient,
                message_body: message.substring(0, 10000), // Truncate if too long
                status: success ? 'sent' : 'failed',
                error_message: errorDetails || (success ? null : 'Failed to send - check credentials and configuration'),
                external_message_id: externalMessageId,
                sent_at: success ? new Date().toISOString() : null,
                metadata: {
                  method,
                  message_length: message.length,
                  has_news: !!news,
                  has_quote: !!quote,
                  has_challenge: !!challenge,
                  topics_count: topics.length
                }
              })
          } catch (logError) {
            console.error(`Error logging message for user ${user.id}, method ${method}:`, logError)
            // Don't fail the whole process if logging fails
          }

          results.push({
            userId: user.id,
            method,
            success,
            message: success ? 'Sent' : 'Failed - credentials missing'
          })
        }

        console.log(`Processed notifications for user ${user.id}`)
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          method: 'all',
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`Daily notifications completed: ${successCount}/${results.length} notifications sent`)

    return new Response(JSON.stringify({
      message: 'Daily notifications processed',
      totalUsers: users.length,
      notificationsSent: successCount,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Daily notifications cron error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

