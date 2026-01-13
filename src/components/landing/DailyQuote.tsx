import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getDailyQuote } from "@/lib/ai-content-service";

export const DailyQuote = () => {
    const { toast } = useToast();
    const [quote, setQuote] = useState<{ quote: string; author?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuote = async () => {
            try {
                const dailyQuote = await getDailyQuote();
                setQuote(dailyQuote);
            } catch (err) {
                console.error('Error loading quote:', err);
                // Fallback quote
                setQuote({
                    quote: "The secret of getting ahead is getting started.",
                    author: "Mark Twain"
                });
            } finally {
                setLoading(false);
            }
        };
        loadQuote();
    }, []);

    const handleShare = () => {
        if (!quote) return;
        const shareText = quote.author 
            ? `"${quote.quote}" - ${quote.author}`
            : `"${quote.quote}"`;
        navigator.clipboard.writeText(shareText);
        toast({
            title: "Copied to clipboard",
            description: "Share this quote with a friend!",
        });
    };

    return (
        <section className="py-8 px-4 w-full max-w-md mx-auto mb-20">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Quote className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Quote of the Day</h2>
                        <p className="text-xs text-pink-500/80 dark:text-pink-300">Daily inspiration</p>
                    </div>
                </div>

                <Card className="bg-card/50 backdrop-blur-md border-pink-500/20 overflow-hidden relative">
                    <div className="p-8 text-center">
                        <Quote className="w-8 h-8 text-pink-400/30 absolute top-4 left-4 transform -scale-x-100" />

                        {loading ? (
                            <div className="py-12">
                                <div className="w-8 h-8 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto" />
                            </div>
                        ) : quote ? (
                            <>
                                <blockquote className="text-xl md:text-2xl font-serif text-foreground italic leading-relaxed mb-6">
                                    "{quote.quote}"
                                </blockquote>

                                {quote.author && (
                                    <cite className="text-pink-600 dark:text-pink-200 font-medium not-italic block mb-6">
                                        — {quote.author}
                                    </cite>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleShare}
                                    className="text-pink-600 hover:text-pink-700 dark:text-pink-200 dark:hover:text-white hover:bg-pink-100 dark:hover:bg-pink-900/20"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Quote
                                </Button>
                            </>
                        ) : null}

                        <Quote className="w-8 h-8 text-pink-400/30 absolute bottom-4 right-4" />
                    </div>
                </Card>
            </motion.div>
        </section>
    );
};
