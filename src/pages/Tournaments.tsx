import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Medal, Users, Calendar, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveTournaments, getTournamentLeaderboard, joinTournament, Tournament, TournamentParticipant } from '@/lib/tournament-service';
import { useToast } from '@/hooks/use-toast';

const Tournaments = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadLeaderboard(selectedTournament.id);
    }
  }, [selectedTournament]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (data) {
        setUserId(data.id);
        const activeTournaments = await getActiveTournaments();
        setTournaments(activeTournaments);
        if (activeTournaments.length > 0) {
          setSelectedTournament(activeTournaments[0]);
        }
      }
    }
    setLoading(false);
  };

  const loadLeaderboard = async (tournamentId: string) => {
    const leaderboardData = await getTournamentLeaderboard(tournamentId, 20);
    setLeaderboard(leaderboardData);
  };

  const handleJoin = async (tournament: Tournament) => {
    if (!userId) return;

    const success = await joinTournament(userId, tournament.id);
    if (success) {
      toast({ title: 'Joined!', description: `You've joined ${tournament.name}` });
      loadLeaderboard(tournament.id);
    } else {
      toast({ title: 'Error', description: 'Failed to join tournament', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
            <p className="text-muted-foreground">Compete for prizes and glory</p>
          </motion.div>

          {tournaments.length === 0 ? (
            <Card className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No active tournaments</h3>
              <p className="text-muted-foreground">Check back soon for new competitions!</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tournament List */}
              <div className="md:col-span-1 space-y-4">
                {tournaments.map((tournament) => (
                  <Card
                    key={tournament.id}
                    className={`cursor-pointer transition-all ${
                      selectedTournament?.id === tournament.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedTournament(tournament)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        {tournament.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{tournament.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(tournament.end_date).toLocaleDateString()}
                      </div>
                      {tournament.prize_description && (
                        <div className="mt-2 text-sm font-medium text-primary">
                          Prize: {tournament.prize_description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Leaderboard */}
              <div className="md:col-span-2">
                {selectedTournament && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Leaderboard
                        </CardTitle>
                        <Button
                          size="sm"
                          onClick={() => handleJoin(selectedTournament)}
                        >
                          Join Tournament
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {leaderboard.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No participants yet. Be the first to join!
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {leaderboard.map((participant, index) => {
                            const isCurrentUser = participant.user_id === userId;
                            const getRankIcon = () => {
                              if (participant.rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
                              if (participant.rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
                              if (participant.rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
                              return <span className="w-5 text-center font-bold text-muted-foreground">{participant.rank}</span>;
                            };

                            return (
                              <motion.div
                                key={participant.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                                  isCurrentUser
                                    ? 'bg-primary/10 border-2 border-primary/30'
                                    : 'bg-muted/30 hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center justify-center w-8">
                                  {getRankIcon()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                                    {participant.user?.full_name || 'Unknown'}
                                    {isCurrentUser && <span className="text-xs ml-2">(You)</span>}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 font-bold text-primary">
                                    <Zap className="w-4 h-4" />
                                    {participant.score.toLocaleString()}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tournaments;

