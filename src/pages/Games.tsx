import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Calculator, Shuffle, BrainCircuit, Loader2, Trophy, Gamepad2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Leaderboard } from '@/components/Leaderboard';
import { supabase } from '@/integrations/supabase/client';

const Games = () => {
  const navigate = useNavigate();
  const [loadingGame, setLoadingGame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('games');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();
      if (data) {
        setUserId(data.id);
      }
    }
  };

  const games = [
    {
      id: 'wordle',
      title: 'Word Guess',
      description: 'Guess the 5-letter word in 6 tries.',
      icon: <Grid3X3 className="w-10 h-10 text-green-500" />,
      route: '/games/wordle',
      color: 'from-green-500/30 to-emerald-500/30',
      borderColor: 'border-green-500/30 hover:border-green-500/60',
      bgColor: 'bg-green-500/10',
    },
    {
      id: '2048',
      title: '2048',
      description: 'Merge tiles to reach 2048!',
      icon: <Calculator className="w-10 h-10 text-amber-500" />,
      route: '/games/2048',
      color: 'from-amber-500/30 to-orange-500/30',
      borderColor: 'border-amber-500/30 hover:border-amber-500/60',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Classic number puzzle game.',
      icon: <BrainCircuit className="w-10 h-10 text-blue-500" />,
      route: '/games/sudoku',
      color: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'descramble',
      title: 'Word Descramble',
      description: 'Unscramble letters to form words.',
      icon: <Shuffle className="w-10 h-10 text-purple-500" />,
      route: '/games/descramble',
      color: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const handleGameClick = (game: typeof games[0]) => {
    setLoadingGame(game.id);
    setTimeout(() => {
      navigate(game.route);
      setLoadingGame(null);
    }, 500);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 mt-4"
          >
            <div className="inline-block mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Gamepad2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Games & Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Challenge your mind and compete with friends
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Games
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games">
              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`p-8 bg-gradient-to-br ${game.color} backdrop-blur-md border-2 ${game.borderColor} shadow-xl hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden min-h-[200px]`}
                      onClick={() => handleGameClick(game)}
                    >
                      <AnimatePresence>
                        {loadingGame === game.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/90 backdrop-blur-sm z-20 flex items-center justify-center"
                          >
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                              <p className="text-lg font-semibold text-foreground">Loading {game.title}...</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 ${game.bgColor} rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform`}>
                            {game.icon}
                          </div>
                          <Button
                            variant="ghost"
                            className="text-muted-foreground group-hover:text-foreground group-hover:bg-background/20 transition-all"
                            disabled={loadingGame === game.id}
                          >
                            {loadingGame === game.id ? 'Loading...' : 'Play'}
                          </Button>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {game.title}
                          </h3>
                          <p className="text-base text-muted-foreground">
                            {game.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              {userId ? (
                <Leaderboard userId={userId} />
              ) : (
                <Card className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Please log in to view leaderboards and add friends
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Games;
