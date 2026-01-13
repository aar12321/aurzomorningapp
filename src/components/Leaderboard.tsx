import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Users, 
  Crown, 
  Medal, 
  Flame, 
  Zap, 
  UserPlus,
  Check,
  X,
  Share2,
  Loader2,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsLeaderboard,
  getGlobalLeaderboard,
  getPersonalRecords,
  LeaderboardEntry,
  FriendRequest,
  PersonalRecord
} from '@/lib/friends-service';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardProps {
  userId: string;
}

const RECORD_LABELS: Record<string, { label: string; icon: string; unit: string }> = {
  'wordle_streak': { label: 'Wordle Win Streak', icon: '🔤', unit: 'games' },
  'wordle_best': { label: 'Best Wordle', icon: '🔤', unit: 'guesses' },
  'sudoku_best': { label: 'Best Sudoku Time', icon: '🔢', unit: 'seconds' },
  'sudoku_fastest': { label: 'Fastest Sudoku', icon: '🔢', unit: 'seconds' },
  '2048_high': { label: '2048 High Score', icon: '🎮', unit: 'points' },
  'descramble_high': { label: 'Descramble High', icon: '🔀', unit: 'points' },
  'quiz_perfect_streak': { label: 'Perfect Quiz Streak', icon: '📚', unit: 'quizzes' },
  'quiz_highest_accuracy': { label: 'Best Quiz Accuracy', icon: '📚', unit: '%' },
  'longest_streak': { label: 'Longest Streak', icon: '🔥', unit: 'days' },
  'most_xp_day': { label: 'Most XP in a Day', icon: '⚡', unit: 'XP' }
};

export const Leaderboard = ({ userId }: LeaderboardProps) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friends, global, records, pending] = await Promise.all([
        getFriendsLeaderboard(userId),
        getGlobalLeaderboard(20),
        getPersonalRecords(userId),
        getPendingRequests(userId)
      ]);

      setFriendsLeaderboard(friends);
      setGlobalLeaderboard(global);
      setPersonalRecords(records);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendEmail.trim()) return;

    setSendingRequest(true);
    const result = await sendFriendRequest(userId, friendEmail.trim());
    
    toast({
      title: result.success ? 'Friend Request Sent!' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive'
    });

    if (result.success) {
      setFriendEmail('');
    }
    setSendingRequest(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      toast({ title: 'Friend Added!', description: 'You are now friends' });
      loadData();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const success = await rejectFriendRequest(requestId);
    if (success) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const LeaderboardList = ({ entries }: { entries: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {activeTab === 'friends' ? 'Add friends to see your friend leaderboard!' : 'No leaderboard data yet'}
        </p>
      ) : (
        entries.map((entry, index) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              entry.is_current_user 
                ? 'bg-primary/10 border-2 border-primary/30' 
                : 'bg-muted/30 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(entry.rank_position)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${entry.is_current_user ? 'text-primary' : 'text-foreground'}`}>
                {entry.full_name}
                {entry.is_current_user && <span className="text-xs ml-2">(You)</span>}
              </p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {entry.streak_count}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 font-bold text-primary">
                <Zap className="w-4 h-4" />
                {entry.total_xp.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading leaderboards...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Friend Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Friend Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map(request => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-background rounded-lg"
              >
                <div>
                  <p className="font-medium">{request.from_user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{request.from_user.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Friend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter friend's email..."
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendFriendRequest}
              disabled={sendingRequest || !friendEmail.trim()}
            >
              {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Friends</span>
              </TabsTrigger>
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Global</span>
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Records</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-0">
              <LeaderboardList entries={friendsLeaderboard} />
            </TabsContent>

            <TabsContent value="global" className="mt-0">
              <LeaderboardList entries={globalLeaderboard} />
            </TabsContent>

            <TabsContent value="records" className="mt-0">
              <div className="space-y-3">
                {personalRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No personal records yet. Start playing to set some records!
                  </p>
                ) : (
                  personalRecords.map((record, index) => {
                    const info = RECORD_LABELS[record.record_type] || {
                      label: record.record_type,
                      icon: '🏆',
                      unit: ''
                    };
                    return (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20"
                      >
                        <span className="text-2xl">{info.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{info.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Achieved {new Date(record.achieved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {record.value.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{info.unit}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

