import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Lock, Clock } from 'lucide-react';
import { getTopicIcon } from '@/lib/topic-icons';

interface UserTopic {
  id: string;
  topic_id: string;
  current_day: number;
  completed_days: number;
  unlock_day?: number;
  topics: { name: string; category: string } | { name: string; category: string }[];
  completedToday?: boolean;
  maxDay?: number;
}

interface DailyQuizzesSectionProps {
  topics: UserTopic[];
  onStartQuiz: (topic: UserTopic) => void;
}

export const DailyQuizzesSection = ({ topics, onStartQuiz }: DailyQuizzesSectionProps) => {
  const navigate = useNavigate();

  const canTakeQuiz = (topic: UserTopic) => {
    if (topic.completedToday) return false;
    const unlockDay = topic.unlock_day || 1;
    return unlockDay >= topic.current_day;
  };

  const getQuizStatus = (topic: UserTopic) => {
    if (topic.completedToday) {
      return {
        text: 'Completed',
        locked: false,
        color: 'text-green-400',
        icon: <CheckCircle className="w-4 h-4" />,
      };
    }
    if (topic.maxDay && topic.current_day === topic.maxDay) {
      return {
        text: 'Last Day',
        locked: false,
        color: 'text-yellow-400',
        icon: <Clock className="w-4 h-4" />,
      };
    }
    const unlockDay = topic.unlock_day || 1;
    if (unlockDay < topic.current_day) {
      return {
        text: 'Unlocks Tomorrow',
        locked: true,
        color: 'text-gray-400',
        icon: <Lock className="w-4 h-4" />,
      };
    }
    return {
      text: 'Start Quiz',
      locked: false,
      color: 'text-blue-400',
      icon: <ArrowRight className="w-4 h-4" />,
    };
  };

  if (topics.length === 0) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4">Your Learning Path</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Add topics in settings to start your daily learning journey.
          </p>
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Go to Settings
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center snap-start px-4 sm:px-6 py-12 md:py-20">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Daily Quizzes
          </h2>
          <p className="text-lg text-muted-foreground">
            Continue your learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {topics.map((topic, index) => {
            const status = getQuizStatus(topic);
            const topicName = Array.isArray(topic.topics)
              ? topic.topics[0]?.name
              : topic.topics?.name || 'Unknown Topic';
            const category = Array.isArray(topic.topics)
              ? topic.topics[0]?.category
              : topic.topics?.category || 'General';

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${
                  status.locked
                    ? 'glass-panel opacity-60'
                    : 'glass-panel hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                }`}
                onClick={() => canTakeQuiz(topic) && onStartQuiz(topic)}
              >
                <div className="p-4 md:p-6 flex flex-col gap-3 md:gap-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="text-3xl md:text-4xl p-3 md:p-4 bg-background/50 rounded-xl md:rounded-2xl border border-border/5 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                      {getTopicIcon(topicName, category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base md:text-xl mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {topicName}
                      </h3>
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground font-medium flex-wrap">
                        <span className="bg-accent/50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-foreground/80 border border-border/5 whitespace-nowrap">
                          Day {topic.current_day}
                        </span>
                        <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-border" />
                        <span className="truncate">{category}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canTakeQuiz(topic)) onStartQuiz(topic);
                    }}
                    disabled={!canTakeQuiz(topic)}
                    className={`w-full h-10 md:h-12 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
                      status.locked
                        ? 'bg-accent/50 text-muted-foreground cursor-not-allowed'
                        : status.text === 'Completed'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {status.icon}
                      <span className="truncate">{status.text}</span>
                    </div>
                  </Button>
                </div>

                {!status.locked && !topic.completedToday && (
                  <div className="absolute bottom-0 left-0 h-1 bg-primary w-0 group-hover:w-full transition-all duration-700 ease-out" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

