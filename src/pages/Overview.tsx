import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserPreferences } from '@/lib/user-preferences-service';
import { HeroSection } from '@/components/overview/HeroSection';
import { DailyQuizzesSection } from '@/components/overview/DailyQuizzesSection';
import { NewsSection } from '@/components/overview/NewsSection';
import { WeatherSection } from '@/components/overview/WeatherSection';
import { QuoteSection } from '@/components/overview/QuoteSection';
import { GoalSection } from '@/components/overview/GoalSection';
import { StatsSection } from '@/components/overview/StatsSection';
import { SettingsModal } from '@/components/SettingsModal';
import { Layout } from '@/components/Layout';

interface UserTopic {
  id: string;
  topic_id: string;
  current_day: number;
  completed_days: number;
  unlock_day?: number;
  topics: { name: string; category: string } | { name: string; category: string }[];
  completedToday?: boolean;
  maxDay?: number;
}

const Overview = () => {
  const [user, setUser] = useState<any>(null);
  const [userTopics, setUserTopics] = useState<UserTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectingRef = useRef(false);

  useEffect(() => {
    fetchUserData();
    loadUserPreferences();
    
    // Listen for settings open event from Layout
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener('openSettings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  const loadUserPreferences = async () => {
    try {
      const preferences = await getUserPreferences();
      // Preferences are automatically synced to localStorage by the service
      // Components will pick them up from there or fetch directly
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (window.location.pathname === '/overview' && !redirectingRef.current) {
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
              if (!retrySession && window.location.pathname === '/overview' && !redirectingRef.current) {
                redirectingRef.current = true;
                navigate('/', { replace: true });
              }
            });
          }, 2000);
        }
        setIsLoading(false);
        return;
      }

      redirectingRef.current = false;

      // Fetch user data
      let userData = null;
      let retries = 0;
      const maxRetries = 10;

      while (!userData && retries < maxRetries) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (data) {
          userData = data;
          break;
        }

        if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        } else if (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        break;
      }

      if (!userData) {
        let fullName = 'User';
        const pendingSignup = localStorage.getItem('pending_google_signup');
        if (pendingSignup) {
          try {
            const signupData = JSON.parse(pendingSignup);
            if (signupData.fullName) {
              fullName = signupData.fullName;
            }
          } catch (e) {
            console.warn('Error parsing pending signup data:', e);
          }
        }

        if (fullName === 'User') {
          fullName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0] ||
            'User';
        }

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: session.user.id,
            email: session.user.email || '',
            full_name: fullName,
            timezone: 'America/New_York',
            streak_count: 0,
            total_xp: 0,
          })
          .select('*')
          .maybeSingle();

        if (newUser && !createError) {
          userData = newUser;
        } else {
          console.error('User profile not found and could not be created:', createError);
          toast({
            title: 'Error',
            description: 'Failed to load your profile. Please refresh the page or contact support.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }

      setUser(userData);

      // Fetch today's quiz attempts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndStr = todayEnd.toISOString();

      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          score,
          total_questions,
          completed_at,
          quiz_id,
          quizzes (day_number, topic_id)
        `)
        .gte('completed_at', todayStart)
        .lte('completed_at', todayEndStr)
        .order('completed_at', { ascending: false });

      const todayAttemptsByTopic: Record<string, boolean> = {};
      if (attemptsData) {
        attemptsData.forEach((attempt: any) => {
          if (attempt.quizzes) {
            const quiz = Array.isArray(attempt.quizzes) ? attempt.quizzes[0] : attempt.quizzes;
            if (quiz && quiz.topic_id) {
              todayAttemptsByTopic[quiz.topic_id] = true;
            }
          }
        });
      }

      // Fetch user topics
      let allTopicsData = null;
      let topicsRetries = 0;
      const maxTopicsRetries = 5;

      while (!allTopicsData && topicsRetries < maxTopicsRetries) {
        const { data, error } = await supabase
          .from('user_topics')
          .select(`
            id,
            topic_id,
            current_day,
            completed_days,
            unlock_day,
            topics (name, category)
          `)
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          allTopicsData = data;
          break;
        }

        topicsRetries++;
        if (topicsRetries < maxTopicsRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        allTopicsData = [];
        break;
      }

      if (allTopicsData && allTopicsData.length > 0) {
        const topicIds = allTopicsData.map((t: any) => t.topic_id);

        const { data: allQuizzes } = await supabase
          .from('quizzes')
          .select('topic_id, day_number')
          .in('topic_id', topicIds);

        const maxDaysByTopic: Record<string, number> = {};
        if (allQuizzes) {
          allQuizzes.forEach((quiz: any) => {
            const topicId = quiz.topic_id;
            const dayNum = quiz.day_number;
            if (!maxDaysByTopic[topicId] || dayNum > maxDaysByTopic[topicId]) {
              maxDaysByTopic[topicId] = dayNum;
            }
          });
        }

        const topicsWithMaxDay = allTopicsData.map((topic: any) => ({
          ...topic,
          maxDay: maxDaysByTopic[topic.topic_id] || topic.current_day,
        }));

        const topicsWithStatus = topicsWithMaxDay.map((topic: any) => {
          const isCompleted = todayAttemptsByTopic[topic.topic_id] || false;
          return {
            ...topic,
            completedToday: isCompleted,
          };
        });
        setUserTopics(topicsWithStatus as unknown as UserTopic[]);
      } else {
        setUserTopics([]);
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = async (topic: UserTopic) => {
    try {
      const { data: quizExists, error: checkError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', topic.topic_id)
        .eq('day_number', topic.current_day)
        .maybeSingle();

      if (checkError) {
        toast({
          title: 'Error',
          description: 'Could not verify quiz availability. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (!quizExists) {
        toast({
          title: 'Coming Soon',
          description: `Day ${topic.current_day} content is not available yet. Please check back later!`,
        });
        return;
      }

      navigate(`/quiz/${topic.topic_id}/${topic.current_day}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary/80 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Waking up your dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <Layout onSettingsClick={() => setSettingsOpen(true)}>
      <div className="w-full bg-background" style={{ height: '100vh', overflowY: 'auto', scrollSnapType: 'y mandatory' }}>
        <style>{`
          .snap-start {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
          @media (min-width: 768px) {
            /* Better desktop scrolling - less aggressive snap */
            .snap-start {
              scroll-snap-stop: normal;
            }
          }
        `}</style>
        <HeroSection userName={userName} />
        <StatsSection 
          streakCount={user?.streak_count || 0} 
          totalXP={user?.total_xp || 0} 
          badges={0}
        />
        <DailyQuizzesSection topics={userTopics} onStartQuiz={startQuiz} />
        <NewsSection />
        <WeatherSection />
        <QuoteSection />
        <GoalSection />
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Layout>
  );
};

export default Overview;

