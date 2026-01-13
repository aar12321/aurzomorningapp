import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Calendar, Target, Brain, Gamepad2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getLearningAnalytics, getHabitAnalytics, getGameAnalytics } from '@/lib/analytics-service';
import { getPersonalizedInsights } from '@/lib/ai-recommendations-service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Analytics = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [learningData, setLearningData] = useState<any>(null);
  const [habitData, setHabitData] = useState<any>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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
        const [learning, habits, games, personalizedInsights] = await Promise.all([
          getLearningAnalytics(data.id),
          getHabitAnalytics(data.id),
          getGameAnalytics(data.id),
          getPersonalizedInsights(data.id)
        ]);

        setLearningData(learning);
        setHabitData(habits);
        setGameData(games);
        setInsights(personalizedInsights);
      }
    }
    setLoading(false);
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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and insights</p>
          </motion.div>

          {/* Insights */}
          {insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Personalized Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.map((insight, i) => (
                      <p key={i} className="text-foreground">{insight}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs defaultValue="learning" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="learning" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="habits" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Habits
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Games
              </TabsTrigger>
            </TabsList>

            <TabsContent value="learning">
              {learningData && (
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{learningData.totalQuizzes}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{learningData.averageAccuracy.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Flashcards</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{learningData.totalFlashcards}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {learningData.accuracyTrend.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Accuracy Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={learningData.accuracyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="accuracy" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {learningData.timeOfDayPerformance.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance by Time of Day</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={learningData.timeOfDayPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="accuracy" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="habits">
              {habitData && (
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{habitData.consistencyScore}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{habitData.completionRate}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  {habitData.bestDays.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Best Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          {habitData.bestDays.map((day: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                              {day}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Consistency Heatmap (Last 90 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-13 gap-1">
                        {habitData.consistencyHeatmap.map((day: any, i: number) => (
                          <div
                            key={i}
                            className={`aspect-square rounded ${
                              day.completed ? 'bg-green-500' : 'bg-muted'
                            }`}
                            title={day.date}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="games">
              {gameData && (
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Wordle</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>Wins: {gameData.wordle.wins}</div>
                          <div>Avg Guesses: {gameData.wordle.averageGuesses.toFixed(1)}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">2048</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{gameData['2048'].highScore.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">High Score</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Sudoku</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{gameData.sudoku.bestTime}s</div>
                        <p className="text-sm text-muted-foreground">Best Time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Descramble</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{gameData.descramble.highScore.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">High Score</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;

