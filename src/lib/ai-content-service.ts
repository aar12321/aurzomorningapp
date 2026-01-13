import { supabase } from '@/integrations/supabase/client';

export interface Flashcard {
  front: string;
  back: string;
  order: number;
}

export type TopicType = 
  | 'daily_learn' 
  | 'life' 
  | 'work_money' 
  | 'world_society' 
  | 'self_growth' 
  | 'cooking'
  | 'topic'; // Generic type for all 30 specific topics

interface GenerateFlashcardsParams {
  topicType: TopicType;
  topicName?: string;
  newsArticles?: Array<{ title: string; summary: string }>;
}

/**
 * Generate flashcards using OpenAI GPT-4o-mini
 */
async function generateFlashcardsWithAI(params: GenerateFlashcardsParams): Promise<Flashcard[]> {
  const { topicType, topicName, newsArticles } = params;

  // Use Supabase Edge Function for security (API key stays server-side)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    // Prepare request body - ensure all fields are properly formatted
    const requestBody: any = { 
      topicType,
      ...(topicName && { topicName }),
      ...(newsArticles && newsArticles.length > 0 && { newsArticles })
    };

    console.log('[AI Service] Calling Edge Function with:', { topicType, topicName: topicName || 'none', hasNews: !!newsArticles });

    const { data, error } = await supabase.functions.invoke('generate-flashcards', {
      body: requestBody
    });

    if (error) {
      console.error('[AI Service] Edge function error:', error);
      console.error('[AI Service] Error details:', JSON.stringify(error, null, 2));
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Network request failed')) {
        throw new Error('Network error: Unable to reach the server. Please check your internet connection and try again.');
      }
      if (error.message?.includes('Function not found') || error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error('Server error: The flashcard generation service is not available. Please try again later.');
      }
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
      }
      // Check if error has a message property
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Failed to generate flashcards. Please try again.');
    }
    
    if (!data) {
      console.error('[AI Service] No data received from Edge Function');
      throw new Error('No response from server. Please try again.');
    }

    if (data.error) {
      console.error('[AI Service] Edge Function returned error:', data.error);
      throw new Error(data.error || 'Failed to generate flashcards');
    }
    
    if (!data.flashcards) {
      console.error('[AI Service] Invalid response data - no flashcards:', data);
      throw new Error('Invalid response from server: No flashcards received');
    }

    if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
      console.error('[AI Service] Invalid flashcards array:', data.flashcards);
      throw new Error('Server returned empty flashcards. Please try again.');
    }

    console.log('[AI Service] Successfully received', data.flashcards.length, 'flashcards');
    return data.flashcards;
  } catch (error: any) {
    console.error('[AI Service] Error calling edge function:', error);
    // Provide user-friendly error messages
    const errorMessage = error?.message || 'Failed to generate flashcards';
    
    // Check for specific error types
    if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to send')) {
      throw new Error('Failed to connect to the server. Please check your internet connection and try again.');
    }
    if (errorMessage.includes('Authentication') || errorMessage.includes('auth')) {
      throw new Error('Please log in to generate flashcards.');
    }
    
    // Re-throw with the error message
    throw new Error(errorMessage);
  }
}

/**
 * Get or generate flashcards for a topic and date
 * 
 * IMPORTANT: This function ensures AI is only called ONCE per day per topic for ALL users.
 * 
 * How it works:
 * 1. Always checks database cache first (by topic_type, date, and topic_name)
 * 2. If cached content exists, returns it immediately (no AI call = no cost)
 * 3. If no cache exists, generates new content with AI
 * 4. Attempts to save to database (unique constraint prevents duplicates)
 * 5. If save fails due to race condition (another user generated it), fetches their version
 * 
 * This means:
 * - First user of the day for a topic: AI generates content (costs money)
 * - All subsequent users: Get cached content (free)
 * - All users get the same content for that day (consistent experience)
 * 
 * Cost optimization: Only 1 AI call per topic per day, regardless of user count
 */
/**
 * Fetch news articles deterministically for daily_learn
 * Uses date as seed to ensure all users get same news on same day
 */
async function fetchDailyNews(): Promise<Array<{ title: string; summary: string }>> {
  try {
    // Use date as seed for deterministic news selection
    const today = new Date().toISOString().split('T')[0];
    const dateSeed = today.replace(/-/g, ''); // e.g., "20251208"
    
    // Fetch news using the newsApi utility
    const { fetchNews } = await import('@/lib/newsApi');
    const allNews = await fetchNews('general');
    
    // Use date seed to deterministically select top 3 articles
    // This ensures all users get the same articles on the same day
    const seed = parseInt(dateSeed.slice(-6)) % 1000; // Use last 6 digits as seed
    const selectedNews = allNews.slice(0, 10); // Get top 10, then pick 3 deterministically
    
    // Deterministic selection based on date
    const selected = [];
    for (let i = 0; i < 3 && i < selectedNews.length; i++) {
      const index = (seed + i * 3) % selectedNews.length;
      selected.push(selectedNews[index]);
    }
    
    return selected.map(article => ({
      title: article.title,
      summary: article.summary || article.title
    }));
  } catch (error) {
    console.error('Error fetching daily news:', error);
    // Return empty array - AI will still generate flashcards
    return [];
  }
}

export async function getFlashcards(
  topicType: TopicType,
  topicName?: string,
  newsArticles?: Array<{ title: string; summary: string }>
): Promise<Flashcard[]> {
  const today = new Date().toISOString().split('T')[0];

  // ALWAYS check cache first - this ensures we never regenerate if content exists
  let query = supabase
    .from('daily_flashcards')
    .select('flashcards, news_articles')
    .eq('topic_type', topicType)
    .eq('date', today);
  
  // Handle null topic_name properly
  if (topicName) {
    query = query.eq('topic_name', topicName);
  } else {
    query = query.is('topic_name', null);
  }
  
  const { data: cached, error: cacheError } = await query.maybeSingle();

  // If we have cached content, return it immediately (no AI call)
  if (cached?.flashcards && Array.isArray(cached.flashcards) && cached.flashcards.length > 0) {
    console.log(`[Cache Hit] Returning cached flashcards for ${topicType} on ${today}`);
    return cached.flashcards as Flashcard[];
  }

  // Only generate if cache is empty
  console.log(`[Cache Miss] Generating new flashcards for ${topicType} on ${today}`);
  
  try {
    // For daily_learn, use cached news articles if available, otherwise fetch deterministically
    let finalNewsArticles = newsArticles;
    if (topicType === 'daily_learn' && !newsArticles) {
      // First, check if we have cached news articles from a previous generation
      if (cached?.news_articles && Array.isArray(cached.news_articles) && cached.news_articles.length > 0) {
        console.log('[Daily Learn] Using cached news articles from database');
        finalNewsArticles = cached.news_articles as Array<{ title: string; summary: string }>;
      } else {
        // No cached news, fetch fresh (will be stored with flashcards)
        console.log('[Daily Learn] Fetching fresh news articles...');
        finalNewsArticles = await fetchDailyNews();
      }
    }

    // Generate new flashcards
    const flashcards = await generateFlashcardsWithAI({
      topicType,
      topicName,
      newsArticles: finalNewsArticles
    });

    // Try to insert into cache with news articles
    const insertData: any = {
      topic_type: topicType,
      topic_name: topicName || null,
      date: today,
      flashcards: flashcards
    };
    
    // Store news articles for daily_learn
    if (topicType === 'daily_learn' && finalNewsArticles && finalNewsArticles.length > 0) {
      insertData.news_articles = finalNewsArticles;
    }

    const { error: insertError } = await supabase
      .from('daily_flashcards')
      .insert(insertData);

    if (insertError) {
      // If insert failed (likely due to race condition - another user generated it),
      // fetch the existing one from database
      console.log('[Race Condition] Another user generated flashcards, fetching from cache');
      let fetchQuery = supabase
        .from('daily_flashcards')
        .select('flashcards')
        .eq('topic_type', topicType)
        .eq('date', today);
      
      if (topicName) {
        fetchQuery = fetchQuery.eq('topic_name', topicName);
      } else {
        fetchQuery = fetchQuery.is('topic_name', null);
      }
      
      const { data: existing } = await fetchQuery.maybeSingle();

      if (existing?.flashcards && Array.isArray(existing.flashcards)) {
        return existing.flashcards as Flashcard[];
      }
      
      // If we still don't have it, return what we generated (fallback)
      console.warn('[Warning] Could not cache or fetch flashcards, returning generated content');
      return flashcards;
    }

    console.log(`[Success] Cached flashcards for ${topicType} on ${today}`);
    return flashcards;
  } catch (error) {
    console.error('Error in getFlashcards:', error);
    
    // If generation failed, try one more time to fetch from cache
    // (in case another user succeeded while we were generating)
    let fallbackQuery = supabase
      .from('daily_flashcards')
      .select('flashcards')
      .eq('topic_type', topicType)
      .eq('date', today);
    
    if (topicName) {
      fallbackQuery = fallbackQuery.eq('topic_name', topicName);
    } else {
      fallbackQuery = fallbackQuery.is('topic_name', null);
    }
    
    const { data: fallbackCache } = await fallbackQuery.maybeSingle();

    if (fallbackCache?.flashcards && Array.isArray(fallbackCache.flashcards)) {
      console.log('[Fallback] Using cached flashcards after generation error');
      return fallbackCache.flashcards as Flashcard[];
    }

    // If all else fails, throw the error
    throw error;
  }
}

/**
 * Generate a daily quote using OpenAI GPT-4o-mini
 */
async function generateDailyQuoteWithAI(): Promise<{ quote: string; author?: string }> {
  // Use Supabase Edge Function for security
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase.functions.invoke('generate-daily-quote');

    if (error) throw error;
    if (!data?.quote) throw new Error('Invalid response from server');

    return { quote: data.quote, author: data.author };
  } catch (error: any) {
    console.error('Error calling quote edge function:', error);
    throw new Error(error.message || 'Failed to generate quote');
  }
}

/**
 * Get today's quote (with AI generation and caching)
 * 
 * IMPORTANT: This function ensures AI is only called ONCE per day for ALL users.
 * 
 * How it works:
 * 1. Always checks database cache first (by date)
 * 2. If cached content exists, returns it immediately (no AI call = no cost)
 * 3. If no cache exists, generates new content with AI
 * 4. Attempts to save to database (unique constraint prevents duplicates)
 * 5. If save fails due to race condition (another user generated it), fetches their version
 * 
 * This means:
 * - First user of the day: AI generates quote (costs money)
 * - All subsequent users: Get cached quote (free)
 * - All users get the same quote for that day (consistent experience)
 */
export async function getDailyQuote(): Promise<{ quote: string; author?: string }> {
  const today = new Date().toISOString().split('T')[0];

  // ALWAYS check cache first - this ensures we never regenerate if content exists
  const { data: cached, error: cacheError } = await supabase
    .from('daily_quotes')
    .select('quote_text, author')
    .eq('date', today)
    .maybeSingle();

  // If we have cached content, return it immediately (no AI call)
  if (cached?.quote_text) {
    console.log(`[Cache Hit] Returning cached quote for ${today}`);
    return { quote: cached.quote_text, author: cached.author || undefined };
  }

  // Only generate if cache is empty
  console.log(`[Cache Miss] Generating new quote for ${today}`);
  
  try {
    // Generate new quote
    const quoteData = await generateDailyQuoteWithAI();

    // Try to insert into cache
    // Use insert with error handling to catch race conditions
    // If another user generated it at the same time, we'll just fetch theirs
    const { error: insertError } = await supabase
      .from('daily_quotes')
      .insert({
        quote_text: quoteData.quote,
        author: quoteData.author || null,
        date: today
      });

    if (insertError) {
      // If insert failed (likely due to race condition - another user generated it),
      // fetch the existing one from database
      console.log('[Race Condition] Another user generated quote, fetching from cache');
      const { data: existing } = await supabase
        .from('daily_quotes')
        .select('quote_text, author')
        .eq('date', today)
        .maybeSingle();

      if (existing?.quote_text) {
        return { quote: existing.quote_text, author: existing.author || undefined };
      }
      
      // If we still don't have it, return what we generated (fallback)
      console.warn('[Warning] Could not cache or fetch quote, returning generated content');
      return quoteData;
    }

    console.log(`[Success] Cached quote for ${today}`);
    return quoteData;

  } catch (error) {
    console.error('Error in getDailyQuote:', error);
    
    // If generation failed, try one more time to fetch from cache
    // (in case another user succeeded while we were generating)
    const { data: fallbackCache } = await supabase
      .from('daily_quotes')
      .select('quote_text, author')
      .eq('date', today)
      .maybeSingle();

    if (fallbackCache?.quote_text) {
      console.log('[Fallback] Using cached quote after generation error');
      return { quote: fallbackCache.quote_text, author: fallbackCache.author || undefined };
    }

    // If all else fails, use fallback quotes
    console.warn('[Fallback] Using hardcoded quotes after all attempts failed');
    const fallbackQuotes = [
      { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { quote: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
      { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
    ];

    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return randomQuote;
  }
}

