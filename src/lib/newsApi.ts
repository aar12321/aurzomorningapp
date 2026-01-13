import { supabase } from "@/integrations/supabase/client";

export interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    published_at: string;
    image_url?: string;
}

const API_KEYS = {
    THENEWSAPI: import.meta.env.VITE_THENEWSAPI_KEY || "",
    NEWSAPI_ORG: import.meta.env.VITE_NEWSAPI_ORG_KEY || ""
};

const CACHE_KEY = "morning_loop_news_cache";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const SEEN_ARTICLES_KEY = "morning_loop_seen_articles";

export const fetchNews = async (category: string = "general"): Promise<NewsArticle[]> => {
    const CACHE_KEY_WITH_CAT = `${CACHE_KEY}_${category}`;

    // 1. Check Cache
    const cached = localStorage.getItem(CACHE_KEY_WITH_CAT);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
        }
    }

    // 2. Fetch from APIs (Rotation Strategy)
    let articles: NewsArticle[] = [];
    try {
        articles = await fetchFromTheNewsApi(category);
    } catch (e) {
        console.warn("TheNewsAPI failed, trying NewsAPI.org", e);
        try {
            articles = await fetchFromNewsApiOrg(category);
        } catch (e2) {
            console.error("All news APIs failed", e2);
            return [];
        }
    }

    // 3. Deduplication & Filtering
    const seenIds = JSON.parse(localStorage.getItem(SEEN_ARTICLES_KEY) || "[]");
    const newArticles = articles.filter(a => !seenIds.includes(a.id));

    // Update seen list (keep last 500)
    const updatedSeenIds = [...new Set([...seenIds, ...newArticles.map(a => a.id)])].slice(-500);
    localStorage.setItem(SEEN_ARTICLES_KEY, JSON.stringify(updatedSeenIds));

    // 4. Update Cache
    localStorage.setItem(CACHE_KEY_WITH_CAT, JSON.stringify({
        data: newArticles,
        timestamp: Date.now()
    }));

    return newArticles;
};

const fetchFromTheNewsApi = async (category: string): Promise<NewsArticle[]> => {
    // Map our categories to API specific ones if needed
    const apiCategory = category === "general" ? "general" : category.toLowerCase();
    const response = await fetch(
        `https://api.thenewsapi.com/v1/news/top?api_token=${API_KEYS.THENEWSAPI}&locale=us&limit=6&categories=${apiCategory}`
    );
    if (!response.ok) throw new Error("TheNewsAPI failed");
    const data = await response.json();

    return data.data.map((item: any) => ({
        id: item.uuid,
        title: item.title,
        summary: item.description || item.snippet,
        source: item.source,
        url: item.url,
        published_at: item.published_at,
        image_url: item.image_url
    }));
};

const fetchFromNewsApiOrg = async (category: string): Promise<NewsArticle[]> => {
    const apiCategory = category === "general" ? "general" : category.toLowerCase();
    const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&category=${apiCategory}&apiKey=${API_KEYS.NEWSAPI_ORG}&pageSize=6`
    );
    if (!response.ok) throw new Error("NewsAPI.org failed");
    const data = await response.json();

    return data.articles.map((item: any) => ({
        id: item.url,
        title: item.title,
        summary: item.description || item.content,
        source: item.source.name,
        url: item.url,
        published_at: item.publishedAt,
        image_url: item.urlToImage
    }));
};
