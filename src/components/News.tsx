import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchNews, NewsArticle } from "@/lib/newsApi";
import { Clock, ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
    { id: "general", label: "Top Stories" },
    { id: "technology", label: "Tech" },
    { id: "business", label: "Business" },
    { id: "science", label: "Science" },
    { id: "entertainment", label: "Entertain" },
    { id: "health", label: "Health" }
];

const News = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState("general");

    useEffect(() => {
        const loadRef = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from('user_preferences')
                .select('last_news_category')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (data?.last_news_category) {
                setActiveCategory(data.last_news_category);
            }
        };
        loadRef();
    }, []);

    useEffect(() => {
        loadNews(activeCategory);
    }, [activeCategory]);

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                supabase.from('user_preferences').upsert({
                    user_id: session.user.id,
                    last_news_category: category,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
        });
    };

    const loadNews = async (category: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchNews(category);
            setArticles(data);
        } catch (err) {
            setError("Failed to load news. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Latest News</h2>
                    <p className="text-muted-foreground">Curated stories for you</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => loadNews(activeCategory)}
                    className="rounded-full hover:bg-accent"
                >
                    <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
                <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 bg-muted/50 p-1 rounded-xl mb-6">
                    {CATEGORIES.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground"
                        >
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-muted-foreground">Fetching {activeCategory} news...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 space-y-4">
                            <p className="text-destructive">{error}</p>
                            <Button onClick={() => loadNews(activeCategory)} variant="outline" className="text-foreground border-border hover:bg-accent">
                                Retry
                            </Button>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            No news available in this category.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {articles.map((article, index) => (
                                <motion.div
                                    key={`${article.id}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-panel rounded-xl overflow-hidden hover:bg-card/80 transition-all group flex flex-col h-full border border-border/50"
                                >
                                    {article.image_url && (
                                        <div className="h-40 overflow-hidden relative">
                                            <img
                                                src={article.image_url}
                                                alt={article.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 px-2 py-1 rounded text-white backdrop-blur-sm">
                                                {article.source}
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                            {article.title}
                                        </h3>

                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                                            {article.summary}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                            >
                                                Read <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
};

export default News;
