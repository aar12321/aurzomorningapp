import { useState, useEffect } from 'react';
import { Trophy, Flame, Award, TrendingUp, Star, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getUserBadges } from '@/lib/badge-service';
import { getLevelInfo, LevelInfo } from '@/lib/level-service';

interface StatsSectionProps {
  streakCount: number;
  totalXP: number;
  badges?: number;
}

export const StatsSection = ({ streakCount, totalXP, badges = 0 }: StatsSectionProps) => {
  const navigate = useNavigate();
  const [actualBadgeCount, setActualBadgeCount] = useState(badges);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [totalXP]);

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, total_xp')
        .eq('auth_id', session.user.id)
        .single();

      if (userData) {
        const [earnedBadges, level] = await Promise.all([
          getUserBadges(userData.id),
          Promise.resolve(getLevelInfo(userData.total_xp || totalXP))
        ]);
        
        setActualBadgeCount(earnedBadges.length);
        setLevelInfo(level);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use props as fallback
      setLevelInfo(getLevelInfo(totalXP));
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: <Flame className="w-6 h-6" />,
      label: 'Streak',
      value: streakCount,
      suffix: 'days',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: 'Total XP',
      value: totalXP.toLocaleString(),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      gradient: 'from-yellow-500 to-amber-500',
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: 'Badges',
      value: actualBadgeCount,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <section className="min-h-screen snap-start flex items-center justify-center px-4 sm:px-6 py-12 md:py-16 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Progress
          </h2>
          <p className="text-lg text-muted-foreground">
            Track your learning journey and achievements
          </p>
        </motion.div>

        {/* Level Card */}
        {levelInfo && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <span className="text-2xl md:text-3xl font-bold text-primary-foreground">{levelInfo.level}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-lg">{levelInfo.title}</span>
                    <span className="text-muted-foreground">• Level {levelInfo.level}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {levelInfo.xpProgress.toLocaleString()} / {levelInfo.xpNeeded.toLocaleString()} XP to Level {levelInfo.level + 1}
                  </div>
                  <Progress value={levelInfo.progressPercentage} className="h-2" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transition-all group cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 flex items-baseline gap-1">
                  {stat.value}
                  {stat.suffix && <span className="text-sm text-muted-foreground font-normal">{stat.suffix}</span>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => navigate('/profile')}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            View Full Profile
          </Button>
          <Button
            onClick={() => navigate('/games')}
            variant="outline"
            size="lg"
            className="border-2"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Leaderboard
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
