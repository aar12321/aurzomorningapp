import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Check, Flame, TrendingUp, Calendar, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getUserHabits, createHabit, completeHabit, getHabitStats, deleteHabit, Habit, HabitStats } from '@/lib/habit-service';
import { useToast } from '@/hooks/use-toast';

const HABIT_ICONS = ['🔥', '💪', '📚', '🏃', '🧘', '💧', '🌱', '⭐', '🎯', '✨'];
const HABIT_COLORS = [
  'from-orange-500/20 to-red-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-green-500/20 to-emerald-500/20',
  'from-yellow-500/20 to-amber-500/20',
];

const Habits = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<Map<string, HabitStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();

        if (data) {
          setUserId(data.id);
          const userHabits = await getUserHabits(data.id, true);
          setHabits(userHabits);

          // Load stats for each habit
          const statsMap = new Map<string, HabitStats>();
          for (const habit of userHabits) {
            const stats = await getHabitStats(habit.id);
            if (stats) {
              statsMap.set(habit.id, stats);
            }
          }
          setHabitStats(statsMap);
        }
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load habits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim() || !userId || saving) return;

    setSaving(true);
    try {
      // Pick random icon and color
      const icon = HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)];
      const color = HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)];

      const habit = await createHabit(
        userId,
        newHabitName.trim(),
        undefined,
        icon,
        color
      );

      if (habit) {
        setHabits([...habits, habit]);
        setNewHabitName('');
        setShowAddForm(false);
        toast({
          title: 'Habit added! 🎉',
          description: 'Start tracking your progress',
        });
        // Load stats for new habit
        const stats = await getHabitStats(habit.id);
        if (stats) {
          setHabitStats(new Map(habitStats).set(habit.id, stats));
        }
      } else {
        throw new Error('Failed to create habit');
      }
    } catch (error: any) {
      console.error('Error creating habit:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create habit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    const stats = habitStats.get(habitId);
    const today = new Date().toDateString();
    const lastCompleted = stats?.last_completed ? new Date(stats.last_completed).toDateString() : null;

    if (lastCompleted === today) {
      toast({
        title: 'Already completed!',
        description: 'You\'ve already completed this habit today',
      });
      return;
    }

    const success = await completeHabit(habitId);
    if (success) {
      toast({
        title: 'Habit completed! 🎉',
        description: 'Great job! Keep it up!',
      });
      // Reload to update stats
      await loadData();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to complete habit',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    const success = await deleteHabit(habitId);
    if (success) {
      setHabits(habits.filter(h => h.id !== habitId));
      habitStats.delete(habitId);
      toast({
        title: 'Habit deleted',
        description: 'Habit has been removed',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete habit',
        variant: 'destructive',
      });
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
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Habit Tracker</h1>
                <p className="text-muted-foreground">Build consistency, one habit at a time</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Habit
              </Button>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Habit name (e.g., Drink 2 glasses of water)"
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !saving && handleAddHabit()}
                          className="flex-1"
                          disabled={saving}
                        />
                        <Button 
                          onClick={handleAddHabit}
                          disabled={saving || !newHabitName.trim()}
                        >
                          {saving ? 'Adding...' : 'Add'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="text-center py-16 border-dashed">
                <div className="inline-block p-6 bg-primary/10 rounded-full mb-6">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No habits yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start tracking your habits to build consistency and achieve your goals
                </p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Habit
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {habits.map((habit, index) => {
                const stats = habitStats.get(habit.id);
                const today = new Date().toDateString();
                const isCompletedToday = stats?.last_completed ? new Date(stats.last_completed).toDateString() === today : false;
                const colorClass = habit.color || HABIT_COLORS[index % HABIT_COLORS.length];

                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`bg-gradient-to-br ${colorClass} border-2 hover:shadow-xl transition-all relative overflow-hidden group`}>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete habit"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>

                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            <span className="text-4xl">{habit.icon || '📝'}</span>
                            <div>
                              <div>{habit.name}</div>
                              {habit.description && (
                                <p className="text-sm font-normal text-muted-foreground mt-1">
                                  {habit.description}
                                </p>
                              )}
                            </div>
                          </CardTitle>
                          <Button
                            size="lg"
                            onClick={() => handleCompleteHabit(habit.id)}
                            disabled={isCompletedToday}
                            className={`gap-2 ${
                              isCompletedToday 
                                ? 'bg-green-500/20 text-green-600 border-green-500/30' 
                                : 'bg-primary hover:bg-primary/90'
                            }`}
                          >
                            {isCompletedToday ? (
                              <>
                                <Check className="w-5 h-5" />
                                Done Today
                              </>
                            ) : (
                              <>
                                <Check className="w-5 h-5" />
                                Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {stats ? (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                  <Flame className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                  <div className="text-3xl font-bold">{stats.current_streak}</div>
                                  <div className="text-sm text-muted-foreground">Day Streak</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                  <TrendingUp className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                  <div className="text-3xl font-bold">{stats.longest_streak}</div>
                                  <div className="text-sm text-muted-foreground">Best Streak</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                  <Calendar className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                  <div className="text-3xl font-bold">{stats.completion_rate}%</div>
                                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">This Month</span>
                                <span className="font-medium">{stats.completion_rate}% consistent</span>
                              </div>
                              <Progress value={stats.completion_rate} className="h-3" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            Start completing this habit to see your stats!
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Habits;
