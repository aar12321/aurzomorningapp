import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Heart, Target, Smile, Save, History, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { saveJournalEntry, getTodaysJournalEntry, getJournalEntries, JournalEntryType, JournalEntry } from '@/lib/journal-service';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const Journal = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<JournalEntryType>('daily');
  const [viewMode, setViewMode] = useState<'write' | 'history'>('write');
  const [dailyContent, setDailyContent] = useState('');
  const [gratitudeItems, setGratitudeItems] = useState(['', '', '']);
  const [goalReflection, setGoalReflection] = useState('');
  const [moodScore, setMoodScore] = useState(5);
  const [moodContent, setMoodContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyEntries, setHistoryEntries] = useState<JournalEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab, viewMode]);

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
        
        if (viewMode === 'write') {
          const entry = await getTodaysJournalEntry(data.id, activeTab);
          
          if (entry) {
            if (activeTab === 'daily') {
              setDailyContent(entry.content);
            } else if (activeTab === 'gratitude') {
              setGratitudeItems(entry.gratitude_items || ['', '', '']);
            } else if (activeTab === 'goal') {
              setGoalReflection(entry.goal_reflection || '');
            } else if (activeTab === 'mood') {
              setMoodScore(entry.mood_score || 5);
              setMoodContent(entry.content);
            }
          } else {
            // Reset if no entry
            if (activeTab === 'daily') setDailyContent('');
            else if (activeTab === 'gratitude') setGratitudeItems(['', '', '']);
            else if (activeTab === 'goal') setGoalReflection('');
            else if (activeTab === 'mood') {
              setMoodScore(5);
              setMoodContent('');
            }
          }
        } else {
          // Load history
          loadHistory(data.id);
        }
      }
    }
    setLoading(false);
  };

  const loadHistory = async (uid: string) => {
    setLoadingHistory(true);
    try {
      const entries = await getJournalEntries(uid, activeTab, 50);
      setHistoryEntries(entries);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    let content = '';
    let options: any = {};

    if (activeTab === 'daily') {
      content = dailyContent;
    } else if (activeTab === 'gratitude') {
      content = `Gratitude: ${gratitudeItems.filter(i => i.trim()).join(', ')}`;
      options.gratitude_items = gratitudeItems.filter(i => i.trim());
    } else if (activeTab === 'goal') {
      content = goalReflection;
      options.goal_reflection = goalReflection;
    } else if (activeTab === 'mood') {
      content = moodContent;
      options.mood_score = moodScore;
    }

    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter some content', variant: 'destructive' });
      return;
    }

    const entry = await saveJournalEntry(userId, activeTab, content, options);
    if (entry) {
      toast({ title: 'Saved!', description: 'Your journal entry has been saved' });
      // Reload history if in history view
      if (viewMode === 'history') {
        loadHistory(userId);
      }
    } else {
      toast({ title: 'Error', description: 'Failed to save entry', variant: 'destructive' });
    }
  };

  const getEntryIcon = (type: JournalEntryType) => {
    switch (type) {
      case 'daily': return <BookOpen className="w-5 h-5" />;
      case 'gratitude': return <Heart className="w-5 h-5" />;
      case 'goal': return <Target className="w-5 h-5" />;
      case 'mood': return <Smile className="w-5 h-5" />;
    }
  };

  const getEntryColor = (type: JournalEntryType) => {
    switch (type) {
      case 'daily': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'gratitude': return 'from-pink-500/20 to-rose-500/20 border-pink-500/30';
      case 'goal': return 'from-purple-500/20 to-indigo-500/20 border-purple-500/30';
      case 'mood': return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    }
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 9) return '😄';
    if (score >= 7) return '🙂';
    if (score >= 5) return '😐';
    if (score >= 3) return '😕';
    return '😢';
  };

  const groupEntriesByDate = (entries: JournalEntry[]) => {
    const groups: Record<string, JournalEntry[]> = {};
    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
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
                <h1 className="text-4xl font-bold mb-2">Journal</h1>
                <p className="text-muted-foreground">Reflect on your day and track your progress</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'write' ? 'default' : 'outline'}
                  onClick={() => setViewMode('write')}
                  className="gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Write
                </Button>
                <Button
                  variant={viewMode === 'history' ? 'default' : 'outline'}
                  onClick={() => setViewMode('history')}
                  className="gap-2"
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
              </div>
            </div>
          </motion.div>

          {viewMode === 'write' ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JournalEntryType)}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="daily" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Daily
                </TabsTrigger>
                <TabsTrigger value="gratitude" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Gratitude
                </TabsTrigger>
                <TabsTrigger value="goal" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Goals
                </TabsTrigger>
                <TabsTrigger value="mood" className="flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Mood
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Reflection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="How did your day go? What did you learn?"
                      value={dailyContent}
                      onChange={(e) => setDailyContent(e.target.value)}
                      className="min-h-[300px]"
                    />
                    <Button onClick={handleSave} className="mt-4">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gratitude">
                <Card>
                  <CardHeader>
                    <CardTitle>Gratitude Journal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {gratitudeItems.map((item, i) => (
                        <Input
                          key={i}
                          placeholder={`Gratitude ${i + 1}...`}
                          value={item}
                          onChange={(e) => {
                            const newItems = [...gratitudeItems];
                            newItems[i] = e.target.value;
                            setGratitudeItems(newItems);
                          }}
                        />
                      ))}
                    </div>
                    <Button onClick={handleSave} className="mt-4">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goal">
                <Card>
                  <CardHeader>
                    <CardTitle>Goal Reflection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Reflect on yesterday's goal and set today's goal..."
                      value={goalReflection}
                      onChange={(e) => setGoalReflection(e.target.value)}
                      className="min-h-[300px]"
                    />
                    <Button onClick={handleSave} className="mt-4">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mood">
                <Card>
                  <CardHeader>
                    <CardTitle>Mood Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Mood Score (1-10)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={moodScore}
                            onChange={(e) => setMoodScore(parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-2xl font-bold w-12 text-center">{moodScore}</span>
                        </div>
                      </div>
                      <Textarea
                        placeholder="How are you feeling today?"
                        value={moodContent}
                        onChange={(e) => setMoodContent(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                    <Button onClick={handleSave} className="mt-4">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JournalEntryType)}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="daily" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Daily
                  </TabsTrigger>
                  <TabsTrigger value="gratitude" className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Gratitude
                  </TabsTrigger>
                  <TabsTrigger value="goal" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Goals
                  </TabsTrigger>
                  <TabsTrigger value="mood" className="flex items-center gap-2">
                    <Smile className="w-4 h-4" />
                    Mood
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : historyEntries.length === 0 ? (
                    <Card className="text-center py-16">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-2xl font-semibold mb-2">No entries yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Start journaling to see your history here
                      </p>
                      <Button onClick={() => setViewMode('write')}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Start Writing
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(groupEntriesByDate(historyEntries))
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([dateKey, entries]) => (
                          <motion.div
                            key={dateKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-px flex-1 bg-border" />
                              <div className="flex items-center gap-2 px-4">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold text-lg">
                                  {formatDateHeader(dateKey)}
                                </span>
                              </div>
                              <div className="h-px flex-1 bg-border" />
                            </div>

                            <div className="grid gap-4">
                              {entries.map((entry, index) => (
                                <motion.div
                                  key={entry.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <Card className={`bg-gradient-to-br ${getEntryColor(entry.entry_type)} border-2 hover:shadow-xl transition-all`}>
                                    <CardHeader>
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-background/50 rounded-lg">
                                            {getEntryIcon(entry.entry_type)}
                                          </div>
                                          <div>
                                            <CardTitle className="capitalize">
                                              {entry.entry_type === 'daily' ? 'Daily Reflection' :
                                               entry.entry_type === 'gratitude' ? 'Gratitude' :
                                               entry.entry_type === 'goal' ? 'Goals' : 'Mood'}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                            </p>
                                          </div>
                                        </div>
                                        {entry.entry_type === 'mood' && entry.mood_score && (
                                          <div className="text-right">
                                            <div className={`text-4xl ${getMoodColor(entry.mood_score)}`}>
                                              {getMoodEmoji(entry.mood_score)}
                                            </div>
                                            <div className={`text-2xl font-bold ${getMoodColor(entry.mood_score)}`}>
                                              {entry.mood_score}/10
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      {entry.entry_type === 'gratitude' && entry.gratitude_items ? (
                                        <div className="space-y-2">
                                          {entry.gratitude_items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                                              <Sparkles className="w-4 h-4 text-yellow-500" />
                                              <span>{item}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : entry.entry_type === 'goal' && entry.goal_reflection ? (
                                        <div className="space-y-3">
                                          <p className="text-foreground whitespace-pre-wrap">{entry.goal_reflection}</p>
                                        </div>
                                      ) : (
                                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                          {entry.content}
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Journal;
