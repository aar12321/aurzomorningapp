import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { BadgeCollection } from '@/components/BadgeCollection';
import { CelebrationModal } from '@/components/CelebrationModal';
import { 
  ArrowLeft, Trophy, Flame, Award, TrendingUp, Calendar, 
  CheckCircle2, Star, Zap, Target, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Badge as BadgeType, 
  getUserBadges, 
  getUserStatsForBadges,
  UserStats,
  ALL_BADGES
} from '@/lib/badge-service';

interface UserProfile {
  id: string;
  streak_count: number;
  total_xp: number;
  email: string;
  full_name: string;
  created_at: string;
}

interface GameScore {
  game_type: string;
  score: number;
  created_at: string;
  metadata: any;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ badge: BadgeType; earned: boolean } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, email, streak_count, total_xp, created_at')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (userData) {
        setUser(userData);

        // Load badges and stats
        const [badges, stats] = await Promise.all([
          getUserBadges(userData.id),
          getUserStatsForBadges(userData.id)
        ]);
        setEarnedBadgeIds(badges);
        setUserStats(stats);

        // Load game scores
        const { data: scores } = await supabase
          .from('game_scores')
          .select('game_type, score, created_at, metadata')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (scores) {
          setGameScores(scores);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysSinceJoin = () => {
    if (!user?.created_at) return 0;
    const joinDate = new Date(user.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'wordle':
        return '🔤';
      case 'sudoku':
        return '🔢';
      case '2048':
        return '🎮';
      case 'descramble':
        return '🔀';
      default:
        return '🎯';
    }
  };

  const getLevel = () => {
    const xp = user?.total_xp || 0;
    // Logarithmic level curve
    if (xp === 0) return 1;
    return Math.floor(Math.log2(xp / 50 + 1)) + 1;
  };

  const getXPForLevel = (level: number) => {
    return Math.floor(50 * (Math.pow(2, level - 1) - 1));
  };

  const getXPProgress = () => {
    const currentLevel = getLevel();
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const currentXP = user?.total_xp || 0;
    
    return {
      current: currentXP - currentLevelXP,
      required: nextLevelXP - currentLevelXP,
      percentage: Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
    };
  };

  const handleBadgeClick = (badge: BadgeType, earned: boolean) => {
    setSelectedBadge({ badge, earned });
    if (earned) {
      setShowCelebration(true);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary/80 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const level = getLevel();
  const xpProgress = getXPProgress();

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 md:p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/overview')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold">Profile</h1>
          </div>

          {/* Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-primary-foreground">{level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">Level {level}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {xpProgress.current.toLocaleString()} / {xpProgress.required.toLocaleString()} XP to Level {level + 1}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${xpProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-2">
                    <Flame className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{user?.streak_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 mb-2">
                    <Zap className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{(user?.total_xp || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-2">
                    <Award className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{earnedBadgeIds.length}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-2">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{getDaysSinceJoin()}</p>
                  <p className="text-xs text-muted-foreground">Days Active</p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Badge Collection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Badge Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BadgeCollection 
                  userId={user?.id}
                  showLocked={true}
                  onBadgeClick={handleBadgeClick}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{user?.full_name || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Game Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Game Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gameScores.length > 0 ? (
                  <div className="space-y-2">
                    {gameScores.map((score, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getGameIcon(score.game_type)}</span>
                          <div>
                            <p className="font-medium capitalize">{score.game_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(score.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{score.score}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      No game scores yet. Start playing to see your progress!
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/games')}
                    >
                      Play Games
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Celebration Modal */}
      {selectedBadge && (
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => {
            setShowCelebration(false);
            setSelectedBadge(null);
          }}
          type="badge"
          data={{ badge: selectedBadge.badge }}
        />
      )}
    </Layout>
  );
};

export default Profile;
