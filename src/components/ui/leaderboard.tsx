import { motion } from "framer-motion";
import { Trophy, Medal, Award, Crown, Users, Zap, Target, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_xp: number;
  streak_count: number;
  accuracy: number;
  rank_position: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  currentUserId?: string;
  className?: string;
  limit?: number;
}

export const Leaderboard = ({ currentUserId, className = "", limit = 10 }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_daily_leaderboard', { limit_count: limit });

      if (error) throw error;

      const leaderboardData = data?.map((entry: any) => ({
        ...entry,
        isCurrentUser: entry.user_id === currentUserId
      })) || [];

      setEntries(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-500" />;
      default:
        return <Award className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-card backdrop-blur-sm border-2 border-border rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-card backdrop-blur-sm border-2 border-border rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Leaderboard</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{entries.length} learners</span>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.user_id}
            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
              entry.isCurrentUser 
                ? 'bg-primary/10 border-2 border-primary shadow-lg' 
                : 'bg-background/50 border border-border hover:shadow-md'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: entry.isCurrentUser ? 1 : 1.02 }}
          >
            <div className="flex items-center gap-4">
              {getRankIcon(entry.rank_position)}
              <div>
                <h4 className="font-semibold text-foreground">{entry.user_name}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {entry.total_xp} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {entry.streak_count} day streak
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {entry.accuracy}% accuracy
                  </span>
                </div>
              </div>
            </div>
            
            {entry.isCurrentUser && (
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                You
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No leaderboard data available yet</p>
        </div>
      )}
    </div>
  );
};

