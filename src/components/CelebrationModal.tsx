import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { X, Share2, Trophy, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge as BadgeType, getRarityLabel } from '@/lib/badge-service';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'badge' | 'level' | 'streak' | 'achievement';
  data: {
    badge?: BadgeType;
    level?: number;
    streak?: number;
    title?: string;
    subtitle?: string;
    xpReward?: number;
  };
  onShare?: () => void;
}

export const CelebrationModal = ({
  isOpen,
  onClose,
  type,
  data,
  onShare
}: CelebrationModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getTitle = () => {
    switch (type) {
      case 'badge':
        return 'Badge Unlocked!';
      case 'level':
        return 'Level Up!';
      case 'streak':
        return 'Streak Milestone!';
      case 'achievement':
        return data.title || 'Achievement Unlocked!';
      default:
        return 'Congratulations!';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'badge':
        return data.badge?.icon || '🏆';
      case 'level':
        return '⬆️';
      case 'streak':
        return '🔥';
      case 'achievement':
        return '✨';
      default:
        return '🎉';
    }
  };

  const getGradient = () => {
    if (type === 'badge' && data.badge) {
      return data.badge.color;
    }
    switch (type) {
      case 'level':
        return 'from-purple-500 to-pink-500';
      case 'streak':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-yellow-400 to-amber-500';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={300}
              gravity={0.2}
              colors={['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6']}
            />
          )}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header with gradient */}
              <div className={`bg-gradient-to-br ${getGradient()} p-8 text-center relative overflow-hidden`}>
                {/* Animated sparkles */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute top-4 left-4"
                >
                  <Sparkles className="w-6 h-6 text-white/50" />
                </motion.div>
                <motion.div
                  animate={{
                    rotate: [0, -360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute bottom-4 right-4"
                >
                  <Star className="w-6 h-6 text-white/50" />
                </motion.div>

                {/* Main icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-24 h-24 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-6xl shadow-lg"
                >
                  {getIcon()}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {getTitle()}
                </motion.h2>

                {/* Rarity badge for badges */}
                {type === 'badge' && data.badge && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm text-white font-medium"
                  >
                    {getRarityLabel(data.badge.rarity)}
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                {type === 'badge' && data.badge && (
                  <>
                    <h3 className="text-xl font-bold mb-2">{data.badge.name}</h3>
                    <p className="text-muted-foreground mb-4">{data.badge.description}</p>
                  </>
                )}

                {type === 'level' && data.level && (
                  <>
                    <h3 className="text-xl font-bold mb-2">You reached Level {data.level}!</h3>
                    <p className="text-muted-foreground mb-4">
                      Keep up the amazing work! New features unlocked.
                    </p>
                  </>
                )}

                {type === 'streak' && data.streak && (
                  <>
                    <h3 className="text-xl font-bold mb-2">{data.streak}-Day Streak!</h3>
                    <p className="text-muted-foreground mb-4">
                      You're on fire! Keep the momentum going.
                    </p>
                  </>
                )}

                {type === 'achievement' && (
                  <>
                    <h3 className="text-xl font-bold mb-2">{data.title}</h3>
                    {data.subtitle && (
                      <p className="text-muted-foreground mb-4">{data.subtitle}</p>
                    )}
                  </>
                )}

                {/* XP Reward */}
                {data.xpReward && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-6 text-yellow-500"
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold">+{data.xpReward} XP</span>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                  {onShare && (
                    <Button
                      onClick={onShare}
                      className="flex-1 gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;

