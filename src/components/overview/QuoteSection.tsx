import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { getDailyQuote } from '@/lib/ai-content-service';

export const QuoteSection = () => {
  const [quote, setQuote] = useState<{ quote: string; author?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const dailyQuote = await getDailyQuote();
        setQuote(dailyQuote);
      } catch (err) {
        console.error('Error loading quote:', err);
        setQuote({
          quote: "The only way to do great work is to love what you do.",
          author: "Steve Jobs"
        });
      } finally {
        setLoading(false);
      }
    };
    loadQuote();
  }, []);

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start px-6 py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center snap-start px-4 sm:px-6 py-12 md:py-20 bg-muted/20">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-8"
          >
            <div className="p-4 bg-primary/10 rounded-full">
              <Quote className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          {quote && (
            <>
              <motion.blockquote
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-semibold text-foreground mb-8 leading-relaxed"
              >
                "{quote.quote}"
              </motion.blockquote>

              {quote.author && (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-muted-foreground"
                >
                  — {quote.author}
                </motion.p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

