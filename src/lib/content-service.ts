/**
 * Content Service
 * Generates daily content: news, motivational quotes, and challenges
 */

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  category: 'general' | 'sports' | 'stocks' | 'technology';
}

interface Quote {
  text: string;
  author: string;
}

interface DailyChallenge {
  title: string;
  description: string;
}

export class ContentService {
  /**
   * Fetch news from the past 24 hours
   * Uses NewsAPI (free tier: 100 requests/day)
   * Alternative: Guardian API (free), NewsData.io (free tier)
   */
  static async getNews(categories: string[] = ['general']): Promise<NewsItem[]> {
    try {
      // Using NewsAPI - you'll need to sign up at https://newsapi.org
      const apiKey = process.env.NEWS_API_KEY;
      
      if (!apiKey) {
        console.warn('News API key not configured, using mock data');
        return this.getMockNews(categories);
      }

      const newsItems: NewsItem[] = [];
      
      // Fetch news for each category
      for (const category of categories) {
        let query = '';
        let endpoint = '';
        
        switch (category) {
          case 'sports':
            query = 'sports';
            endpoint = 'everything';
            break;
          case 'stocks':
            query = 'stock market OR stocks OR finance';
            endpoint = 'everything';
            break;
          case 'technology':
            query = 'technology';
            endpoint = 'everything';
            break;
          default:
            query = 'general';
            endpoint = 'top-headlines';
        }

        const url = endpoint === 'top-headlines' 
          ? `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`
          : `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=3&apiKey=${apiKey}`;

        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`News API error for ${category}:`, response.statusText);
          continue;
        }

        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
          // Get articles from past 24 hours
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          const recentArticles = data.articles
            .filter((article: any) => {
              const articleDate = new Date(article.publishedAt);
              return articleDate >= yesterday;
            })
            .slice(0, 3)
            .map((article: any) => ({
              title: article.title || 'No title',
              summary: article.description || article.title || 'No summary',
              source: article.source?.name || 'Unknown source',
              category: category as NewsItem['category']
            }));

          newsItems.push(...recentArticles);
        }
      }

      // If no news found, return mock data
      if (newsItems.length === 0) {
        return this.getMockNews(categories);
      }

      return newsItems.slice(0, 5); // Limit to 5 items
    } catch (error) {
      console.error('Error fetching news:', error);
      return this.getMockNews(categories);
    }
  }

  /**
   * Get mock news data (fallback)
   */
  private static getMockNews(categories: string[]): NewsItem[] {
    const mockNews: Record<string, NewsItem[]> = {
      general: [
        {
          title: 'Global Markets Show Positive Trends',
          summary: 'Major indices continue to show resilience in today\'s trading session.',
          source: 'Financial Times',
          category: 'general'
        },
        {
          title: 'Tech Innovations Shape Tomorrow',
          summary: 'Latest developments in AI and automation are transforming industries.',
          source: 'Tech News',
          category: 'general'
        }
      ],
      sports: [
        {
          title: 'Championship Finals Set for This Weekend',
          summary: 'Top teams prepare for the highly anticipated championship match.',
          source: 'Sports Daily',
          category: 'sports'
        }
      ],
      stocks: [
        {
          title: 'Market Opens Strong This Morning',
          summary: 'Investors show confidence as key sectors gain momentum.',
          source: 'Market Watch',
          category: 'stocks'
        }
      ],
      technology: [
        {
          title: 'Breakthrough in Quantum Computing',
          summary: 'Researchers achieve new milestone in quantum processing capabilities.',
          source: 'Tech Weekly',
          category: 'technology'
        }
      ]
    };

    const selectedNews: NewsItem[] = [];
    for (const category of categories) {
      if (mockNews[category]) {
        selectedNews.push(...mockNews[category]);
      }
    }

    return selectedNews.length > 0 ? selectedNews : mockNews.general;
  }

  /**
   * Get motivational quote
   * Uses Quotable API (free) or local database
   */
  static async getQuote(): Promise<Quote> {
    try {
      // Try Quotable API first (free, no API key needed)
      const response = await fetch('https://api.quotable.io/random?tags=motivational,success,inspirational');
      
      if (response.ok) {
        const data = await response.json();
        return {
          text: data.content,
          author: data.author
        };
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    }

    // Fallback to local quotes
    return this.getRandomQuote();
  }

  /**
   * Get random quote from local collection
   */
  private static getRandomQuote(): Quote {
    const quotes: Quote[] = [
      {
        text: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs'
      },
      {
        text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
        author: 'Winston Churchill'
      },
      {
        text: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt'
      },
      {
        text: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle'
      },
      {
        text: 'The only person you are destined to become is the person you decide to be.',
        author: 'Ralph Waldo Emerson'
      },
      {
        text: 'Don\'t watch the clock; do what it does. Keep going.',
        author: 'Sam Levenson'
      },
      {
        text: 'Believe you can and you\'re halfway there.',
        author: 'Theodore Roosevelt'
      }
    ];

    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * Get daily challenge
   * Generates a unique challenge based on the day of year
   */
  static async getDailyChallenge(userName: string, streakCount: number): Promise<DailyChallenge> {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    
    const challenges: DailyChallenge[] = [
      {
        title: 'Speed Challenge',
        description: `Complete all your quizzes in under 5 minutes total today!`
      },
      {
        title: 'Perfect Score Challenge',
        description: `Try to get a perfect score on at least one quiz today.`
      },
      {
        title: 'Streak Builder',
        description: `You're on a ${streakCount} day streak! Let's make it ${streakCount + 1} today.`
      },
      {
        title: 'Early Bird',
        description: `Complete your first quiz before 9 AM today.`
      },
      {
        title: 'Knowledge Seeker',
        description: `Focus on understanding the explanations, not just getting the right answer.`
      },
      {
        title: 'Consistency Champion',
        description: `Complete all ${dayOfYear % 5 + 3} available quizzes today.`
      }
    ];

    // Use day of year to cycle through challenges
    const challengeIndex = dayOfYear % challenges.length;
    return challenges[challengeIndex];
  }

  /**
   * Get all content for a user based on preferences
   */
  static async getContentForUser(
    preferences: {
      include_news: boolean;
      include_quotes: boolean;
      include_challenge: boolean;
      news_categories: string[];
    },
    userName: string,
    streakCount: number
  ): Promise<{
    news?: NewsItem[];
    quote?: Quote;
    challenge?: DailyChallenge;
  }> {
    const content: {
      news?: NewsItem[];
      quote?: Quote;
      challenge?: DailyChallenge;
    } = {};

    if (preferences.include_news) {
      content.news = await this.getNews(preferences.news_categories);
    }

    if (preferences.include_quotes) {
      content.quote = await this.getQuote();
    }

    if (preferences.include_challenge) {
      content.challenge = await this.getDailyChallenge(userName, streakCount);
    }

    return content;
  }
}

