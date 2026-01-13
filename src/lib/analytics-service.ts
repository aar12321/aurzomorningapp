/**
 * Analytics Service
 * Provides learning analytics, habit analytics, and insights
 */

import { supabase } from '@/integrations/supabase/client';

export interface LearningAnalytics {
  totalQuizzes: number;
  totalFlashcards: number;
  averageAccuracy: number;
  accuracyTrend: { date: string; accuracy: number }[];
  topicMastery: { topic: string; mastery: number }[];
  timeOfDayPerformance: { hour: number; accuracy: number }[];
  weeklySummary: { week: string; quizzes: number; accuracy: number }[];
}

export interface HabitAnalytics {
  consistencyScore: number;
  consistencyHeatmap: { date: string; completed: boolean }[];
  bestDays: string[];
  bestTimes: string[];
  streakPatterns: { streak: number; count: number }[];
  completionRate: number;
}

export interface GameAnalytics {
  wordle: { games: number; wins: number; averageGuesses: number };
  sudoku: { games: number; averageTime: number; bestTime: number };
  '2048': { games: number; highScore: number; averageScore: number };
  descramble: { games: number; averageScore: number; highScore: number };
}

/**
 * Get learning analytics
 */
export async function getLearningAnalytics(userId: string): Promise<LearningAnalytics> {
  try {
    // Get user stats
    const { data: user } = await supabase
      .from('users')
      .select('total_quizzes_completed, average_accuracy')
      .eq('id', userId)
      .single();

    // Get quiz history for trends
    const { data: quizHistory } = await supabase
      .from('quiz_results')
      .select('created_at, accuracy')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    // Calculate accuracy trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuizzes = (quizHistory || []).filter(q => 
      new Date(q.created_at) >= thirtyDaysAgo
    );

    const accuracyTrend = recentQuizzes.map(q => ({
      date: q.created_at,
      accuracy: q.accuracy || 0
    }));

    // Get topic mastery (simplified - would need topic tracking)
    const topicMastery: { topic: string; mastery: number }[] = [];

    // Get time of day performance
    const timeOfDayPerformance: { hour: number; accuracy: number }[] = [];
    const hourGroups: Record<number, number[]> = {};

    recentQuizzes.forEach(q => {
      const hour = new Date(q.created_at).getHours();
      if (!hourGroups[hour]) hourGroups[hour] = [];
      hourGroups[hour].push(q.accuracy || 0);
    });

    Object.entries(hourGroups).forEach(([hour, accuracies]) => {
      const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      timeOfDayPerformance.push({ hour: parseInt(hour), accuracy: avg });
    });

    // Weekly summary
    const weeklySummary: { week: string; quizzes: number; accuracy: number }[] = [];
    const weekGroups: Record<string, { quizzes: number; totalAccuracy: number }> = {};

    recentQuizzes.forEach(q => {
      const date = new Date(q.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = { quizzes: 0, totalAccuracy: 0 };
      }
      weekGroups[weekKey].quizzes++;
      weekGroups[weekKey].totalAccuracy += q.accuracy || 0;
    });

    Object.entries(weekGroups).forEach(([week, data]) => {
      weeklySummary.push({
        week,
        quizzes: data.quizzes,
        accuracy: data.totalAccuracy / data.quizzes
      });
    });

    return {
      totalQuizzes: user?.total_quizzes_completed || 0,
      totalFlashcards: 0, // Would need to track this
      averageAccuracy: user?.average_accuracy || 0,
      accuracyTrend,
      topicMastery,
      timeOfDayPerformance: timeOfDayPerformance.sort((a, b) => a.hour - b.hour),
      weeklySummary: weeklySummary.sort((a, b) => a.week.localeCompare(b.week))
    };
  } catch (error) {
    console.error('Error fetching learning analytics:', error);
    return {
      totalQuizzes: 0,
      totalFlashcards: 0,
      averageAccuracy: 0,
      accuracyTrend: [],
      topicMastery: [],
      timeOfDayPerformance: [],
      weeklySummary: []
    };
  }
}

/**
 * Get habit analytics
 */
export async function getHabitAnalytics(userId: string): Promise<HabitAnalytics> {
  try {
    // Get all habit completions for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: habits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const habitIds = (habits || []).map(h => h.id);

    if (habitIds.length === 0) {
      return {
        consistencyScore: 0,
        consistencyHeatmap: [],
        bestDays: [],
        bestTimes: [],
        streakPatterns: [],
        completionRate: 0
      };
    }

    const { data: completions } = await supabase
      .from('habit_completions')
      .select('completed_at')
      .in('habit_id', habitIds)
      .gte('completed_at', ninetyDaysAgo.toISOString())
      .order('completed_at', { ascending: true });

    // Build heatmap
    const heatmap: { date: string; completed: boolean }[] = [];
    const completionDates = new Set(
      (completions || []).map(c => new Date(c.completed_at).toISOString().split('T')[0])
    );

    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (89 - i));
      const dateStr = date.toISOString().split('T')[0];
      heatmap.push({
        date: dateStr,
        completed: completionDates.has(dateStr)
      });
    }

    // Calculate consistency score
    const completedDays = completionDates.size;
    const consistencyScore = Math.round((completedDays / 90) * 100);

    // Best days (day of week)
    const dayCounts: Record<number, number> = {};
    (completions || []).forEach(c => {
      const day = new Date(c.completed_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const bestDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[parseInt(day)];
      });

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = (completions || []).filter(c =>
      new Date(c.completed_at) >= thirtyDaysAgo
    );
    const completionRate = Math.round((recentCompletions.length / 30) * 100);

    return {
      consistencyScore,
      consistencyHeatmap: heatmap,
      bestDays,
      bestTimes: [], // Would need time tracking
      streakPatterns: [], // Would need streak calculation
      completionRate
    };
  } catch (error) {
    console.error('Error fetching habit analytics:', error);
    return {
      consistencyScore: 0,
      consistencyHeatmap: [],
      bestDays: [],
      bestTimes: [],
      streakPatterns: [],
      completionRate: 0
    };
  }
}

/**
 * Get game analytics
 */
export async function getGameAnalytics(userId: string): Promise<GameAnalytics> {
  try {
    // Get personal records
    const { data: records } = await supabase
      .from('personal_records')
      .select('record_type, value')
      .eq('user_id', userId);

    const recordsMap = new Map(
      (records || []).map(r => [r.record_type, r.value])
    );

    return {
      wordle: {
        games: 0, // Would need to track
        wins: recordsMap.get('wordle_streak') || 0,
        averageGuesses: 0
      },
      sudoku: {
        games: 0,
        averageTime: 0,
        bestTime: recordsMap.get('sudoku_fastest') || 0
      },
      '2048': {
        games: 0,
        highScore: recordsMap.get('2048_high') || 0,
        averageScore: 0
      },
      descramble: {
        games: 0,
        averageScore: 0,
        highScore: recordsMap.get('descramble_high') || 0
      }
    };
  } catch (error) {
    console.error('Error fetching game analytics:', error);
    return {
      wordle: { games: 0, wins: 0, averageGuesses: 0 },
      sudoku: { games: 0, averageTime: 0, bestTime: 0 },
      '2048': { games: 0, highScore: 0, averageScore: 0 },
      descramble: { games: 0, averageScore: 0, highScore: 0 }
    };
  }
}

