import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, BookOpen, Bell, MapPin, User, Loader2, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NotificationSettings } from './NotificationSettings';
import { LocationSettings } from './LocationSettings';
import { useIsMobile } from '@/hooks/use-mobile';

interface Topic {
  id: string;
  name: string;
  category: string;
}

interface UserTopic {
  id: string;
  topic_id: string;
  topics: Topic | Topic[];
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState('topics');
  const [userTopics, setUserTopics] = useState<UserTopic[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      loadUserData();
      loadUserTopics();
      loadAvailableTopics();
    }
  }, [open]);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, email, streak_count, total_xp')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUserTopics = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!userData) return;

      const { data, error } = await supabase
        .from('user_topics')
        .select(`
          id,
          topic_id,
          topics (id, name, category)
        `)
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTopics(data || []);
    } catch (error) {
      console.error('Error loading user topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your topics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('category, name');

      if (error) throw error;

      if (data) {
        const EXCLUDED_TOPICS = [
          'Science – General', 'World Events & Trends', 'World Events', 'Financial Literacy',
          'Calculus', 'Math – Calculus', 'Business', 'General Science', 'AI & Tech',
          'SAT/ACT Practice', 'General Knowledge'
        ];

        const filtered = data.filter(topic => !EXCLUDED_TOPICS.includes(topic.name));
        const uniqueByName = filtered.filter((topic, index, self) =>
          index === self.findIndex(t => t.name === topic.name)
        );

        setAvailableTopics(uniqueByName);
      }
    } catch (error) {
      console.error('Error loading available topics:', error);
    }
  };

  const handleAddTopic = async (topicId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!userData) return;

      // Check if user already has 5 topics
      if (userTopics.length >= 5) {
        toast({
          title: 'Limit Reached',
          description: 'You can only have 5 topics at a time. Remove one to add another.',
          variant: 'destructive',
        });
        return;
      }

      // Check if topic already exists
      const exists = userTopics.some(ut => {
        const topic = Array.isArray(ut.topics) ? ut.topics[0] : ut.topics;
        return topic?.id === topicId;
      });

      if (exists) {
        toast({
          title: 'Topic Already Added',
          description: 'This topic is already in your list.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('user_topics')
        .insert({
          user_id: userData.id,
          topic_id: topicId,
          current_day: 1,
          completed_days: 0,
        });

      if (error) throw error;

      toast({
        title: 'Topic Added',
        description: 'Topic has been added to your learning list.',
      });

      loadUserTopics();
    } catch (error: any) {
      console.error('Error adding topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add topic',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTopic = async (userTopicId: string) => {
    try {
      const { error } = await supabase
        .from('user_topics')
        .delete()
        .eq('id', userTopicId);

      if (error) throw error;

      toast({
        title: 'Topic Removed',
        description: 'Topic has been removed from your learning list.',
      });

      loadUserTopics();
    } catch (error: any) {
      console.error('Error removing topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove topic',
        variant: 'destructive',
      });
    }
  };

  const getTopicName = (userTopic: UserTopic): string => {
    const topic = Array.isArray(userTopic.topics) ? userTopic.topics[0] : userTopic.topics;
    return topic?.name || 'Unknown Topic';
  };

  const getTopicCategory = (userTopic: UserTopic): string => {
    const topic = Array.isArray(userTopic.topics) ? userTopic.topics[0] : userTopic.topics;
    return topic?.category || 'Unknown';
  };

  // Group available topics by category
  const topicsByCategory = availableTopics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const userTopicIds = new Set(userTopics.map(ut => {
    const topic = Array.isArray(ut.topics) ? ut.topics[0] : ut.topics;
    return topic?.id;
  }).filter(Boolean));

  if (!open) return null;

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="topics" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Topics</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="location" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">Location</span>
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="topics" className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Your Topics ({userTopics.length}/5)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your learning topics. You can have up to 5 topics at a time.
          </p>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {userTopics.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {userTopics.map((userTopic) => {
                    const topicName = getTopicName(userTopic);
                    const category = getTopicCategory(userTopic);
                    return (
                      <Card key={userTopic.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{topicName}</h4>
                            <p className="text-xs text-muted-foreground">{category}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTopic(userTopic.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 text-center mb-6">
                  <p className="text-muted-foreground">No topics selected yet.</p>
                </Card>
              )}

              {userTopics.length < 5 && (
                <div>
                  <h4 className="font-medium mb-3">Add Topics</h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {Object.entries(topicsByCategory).map(([category, topics]) => (
                      <div key={category}>
                        <h5 className="text-sm font-medium text-muted-foreground mb-2 uppercase">
                          {category}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {topics.map((topic) => {
                            const isSelected = userTopicIds.has(topic.id);
                            return (
                              <Button
                                key={topic.id}
                                variant={isSelected ? "secondary" : "outline"}
                                className="justify-start"
                                onClick={() => !isSelected && handleAddTopic(topic.id)}
                                disabled={isSelected}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {topic.name}
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {topic.name}
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="location">
        <LocationSettings />
      </TabsContent>

      <TabsContent value="profile">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Profile Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your account details and statistics
            </p>
          </div>

          {user ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total XP</p>
                      <p className="text-2xl font-bold">{user.total_xp || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Streak</p>
                      <p className="text-2xl font-bold">{user.streak_count || 0} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile: Drawer from bottom
  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl border-t border-border z-50 max-h-[90vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 id="settings-title" className="text-xl font-semibold">Settings</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Centered Modal
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => onOpenChange(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title-desktop"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary" aria-hidden="true" />
                  <h2 id="settings-title-desktop" className="text-2xl font-semibold">Settings</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {content}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

