import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Trophy, Star, Sparkles, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Badge as BadgeType, 
  ALL_BADGES, 
  getUserBadges, 
  getUserStatsForBadges, 
  getBadgeProgress,
  getRarityColor,
  getRarityLabel,
  UserStats
} from '@/lib/badge-service';
import { shareBadge, canShare } from '@/lib/share-service';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BadgeCollectionProps {
  userId?: string;
  showLocked?: boolean;
  compact?: boolean;
  onBadgeClick?: (badge: BadgeType, earned: boolean) => void;
}

export const BadgeCollection = ({ 
  userId, 
  showLocked = true, 
  compact = false,
  onBadgeClick 
}: BadgeCollectionProps) => {
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userName, setUserName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      
      let currentUserId = userId;
      
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();
        
        if (userData) {
          currentUserId = userData.id;
        }
      }

      if (currentUserId) {
        const [badges, stats, userInfo] = await Promise.all([
          getUserBadges(currentUserId),
          getUserStatsForBadges(currentUserId),
          supabase.from('users').select('full_name').eq('id', currentUserId).single()
        ]);
        
        setEarnedBadgeIds(badges);
        setUserStats(stats);
        if (userInfo.data?.full_name) {
          setUserName(userInfo.data.full_name);
        }
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareBadge = async (badge: BadgeType) => {
    const shared = await shareBadge(badge, userName || undefined);
    if (shared) {
      toast({
        title: 'Shared!',
        description: canShare() ? 'Badge shared successfully!' : 'Badge info copied to clipboard!',
      });
    } else {
      toast({
        title: 'Share failed',
        description: 'Unable to share badge',
        variant: 'destructive',
      });
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: <Trophy className="w-4 h-4" /> },
    { id: 'streak', label: 'Streaks', icon: '🔥' },
    { id: 'xp', label: 'XP', icon: '⭐' },
    { id: 'quiz', label: 'Quizzes', icon: '📚' },
    { id: 'game', label: 'Games', icon: '🎮' },
    { id: 'special', label: 'Special', icon: '✨' },
  ];

  const filteredBadges = selectedCategory === 'all' 
    ? ALL_BADGES 
    : ALL_BADGES.filter(b => b.category === selectedCategory);

  const earnedCount = earnedBadgeIds.length;
  const totalCount = ALL_BADGES.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-2xl font-bold">{earnedCount} / {totalCount}</span>
          </div>
          <p className="text-muted-foreground">Badges Earned</p>
          <Progress value={(earnedCount / totalCount) * 100} className="mt-3 h-2" />
        </motion.div>
      )}

      {/* Category Filters */}
      {!compact && (
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {typeof cat.icon === 'string' ? cat.icon : cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Badge Grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
        <AnimatePresence>
          {filteredBadges.map((badge, index) => {
            const isEarned = earnedBadgeIds.includes(badge.id);
            const progress = userStats ? getBadgeProgress(badge, userStats) : null;
            
            if (!showLocked && !isEarned) return null;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onBadgeClick?.(badge, isEarned)}
                className="cursor-pointer"
              >
                <BadgeCard
                  badge={badge}
                  isEarned={isEarned}
                  progress={progress}
                  compact={compact}
                  onShare={!compact ? handleShareBadge : undefined}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface BadgeCardProps {
  badge: BadgeType;
  isEarned: boolean;
  progress: { current: number; required: number; percentage: number } | null;
  compact?: boolean;
  onShare?: (badge: BadgeType) => void;
}

const BadgeCard = ({ badge, isEarned, progress, compact, onShare }: BadgeCardProps) => {
  if (compact) {
    return (
      <div
        className={`relative aspect-square flex items-center justify-center rounded-xl text-3xl transition-all ${
          isEarned
            ? `bg-gradient-to-br ${badge.color} shadow-lg`
            : 'bg-muted/50 grayscale opacity-50'
        }`}
      >
        {badge.icon}
        {!isEarned && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
            <Lock className="w-4 h-4 text-white/50" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`relative p-4 overflow-hidden transition-all hover:scale-105 border-2 ${
        isEarned 
          ? `${getRarityColor(badge.rarity)} shadow-lg` 
          : 'border-transparent opacity-70'
      }`}
    >
      {/* Share button for earned badges */}
      {isEarned && onShare && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(badge);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Share this badge"
        >
          <Share2 className="w-4 h-4 text-foreground" />
        </button>
      )}

      {/* Rarity indicator */}
      {isEarned && (
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            badge.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
            badge.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
            badge.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
            'bg-gray-500/20 text-gray-500'
          }`}>
            {getRarityLabel(badge.rarity)}
          </span>
        </div>
      )}

      {/* Badge icon */}
      <div className={`w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-2xl text-4xl ${
        isEarned 
          ? `bg-gradient-to-br ${badge.color}` 
          : 'bg-muted'
      }`}>
        {isEarned ? (
          badge.icon
        ) : (
          <Lock className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Badge info */}
      <div className="text-center">
        <h3 className={`font-semibold text-sm ${isEarned ? '' : 'text-muted-foreground'}`}>
          {badge.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {badge.description}
        </p>
      </div>

      {/* Progress bar for locked badges */}
      {!isEarned && progress && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.current}</span>
            <span>{progress.required}</span>
          </div>
          <Progress value={progress.percentage} className="h-1.5" />
        </div>
      )}

      {/* Earned indicator */}
      {isEarned && (
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1 text-xs text-green-500">
            <Check className="w-3 h-3" />
            Earned
          </div>
        </div>
      )}
    </Card>
  );
};

export default BadgeCollection;

