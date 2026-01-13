/**
 * AI Recommendations Service
 * Provides personalized recommendations using AI
 */

import { supabase } from '@/integrations/supabase/client';

export interface TopicRecommendation {
  topic: string;
  reason: string;
  confidence: number;
}

export interface LearningTimeRecommendation {
  optimalHour: number;
  reason: string;
  performanceBoost: number; // percentage
}

export interface GoalRecommendation {
  goal: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDays: number;
}

/**
 * Get topic recommendations
 */
export async function getTopicRecommendations(userId: string): Promise<TopicRecommendation[]> {
  try {
    // Get user's learning history
    const { data: quizHistory } = await supabase
      .from('quiz_results')
      .select('topic, accuracy')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Simple recommendation logic (would be enhanced with AI)
    const topicPerformance: Record<string, { count: number; totalAccuracy: number }> = {};

    (quizHistory || []).forEach(q => {
      if (q.topic) {
        if (!topicPerformance[q.topic]) {
          topicPerformance[q.topic] = { count: 0, totalAccuracy: 0 };
        }
        topicPerformance[q.topic].count++;
        topicPerformance[q.topic].totalAccuracy += q.accuracy || 0;
      }
    });

    const recommendations: TopicRecommendation[] = [];

    // Recommend topics user hasn't tried yet
    const allTopics = ['Life', 'Work & Money', 'World & Society', 'Self-Growth', 'Cooking'];
    allTopics.forEach(topic => {
      if (!topicPerformance[topic]) {
        recommendations.push({
          topic,
          reason: `You haven't explored ${topic} yet. It's a great way to expand your knowledge!`,
          confidence: 0.8
        });
      }
    });

    // Recommend topics where user performs well (to build on strengths)
    Object.entries(topicPerformance).forEach(([topic, stats]) => {
      const avgAccuracy = stats.totalAccuracy / stats.count;
      if (avgAccuracy >= 80 && stats.count < 10) {
        recommendations.push({
          topic,
          reason: `You're doing great in ${topic}! Keep building on this strength.`,
          confidence: 0.9
        });
      }
    });

    return recommendations.slice(0, 5);
  } catch (error) {
    console.error('Error getting topic recommendations:', error);
    return [];
  }
}

/**
 * Get optimal learning time recommendation
 */
export async function getOptimalLearningTime(userId: string): Promise<LearningTimeRecommendation | null> {
  try {
    // Get quiz history with timestamps
    const { data: quizHistory } = await supabase
      .from('quiz_results')
      .select('created_at, accuracy')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!quizHistory || quizHistory.length === 0) {
      return {
        optimalHour: 8,
        reason: 'Morning is typically the best time for learning!',
        performanceBoost: 15
      };
    }

    // Group by hour
    const hourPerformance: Record<number, { count: number; totalAccuracy: number }> = {};

    quizHistory.forEach(q => {
      const hour = new Date(q.created_at).getHours();
      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { count: 0, totalAccuracy: 0 };
      }
      hourPerformance[hour].count++;
      hourPerformance[hour].totalAccuracy += q.accuracy || 0;
    });

    // Find best hour
    let bestHour = 8;
    let bestAvg = 0;

    Object.entries(hourPerformance).forEach(([hour, stats]) => {
      const avg = stats.totalAccuracy / stats.count;
      if (avg > bestAvg && stats.count >= 3) {
        bestAvg = avg;
        bestHour = parseInt(hour);
      }
    });

    return {
      optimalHour: bestHour,
      reason: `Your performance is ${Math.round(bestAvg)}% accurate at ${bestHour}:00. This is your optimal learning time!`,
      performanceBoost: Math.round(bestAvg - 70) // Assuming 70% is baseline
    };
  } catch (error) {
    console.error('Error getting optimal learning time:', error);
    return null;
  }
}

/**
 * Get goal recommendations
 */
export async function getGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('total_xp, streak_count, total_quizzes_completed')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const recommendations: GoalRecommendation[] = [];

    // Streak goals
    const currentStreak = user.streak_count || 0;
    if (currentStreak < 7) {
      recommendations.push({
        goal: 'Build a 7-day streak',
        description: 'Complete your routine for 7 consecutive days',
        difficulty: 'easy',
        estimatedDays: 7 - currentStreak
      });
    } else if (currentStreak < 30) {
      recommendations.push({
        goal: 'Reach a 30-day streak',
        description: 'Maintain your routine for a full month',
        difficulty: 'medium',
        estimatedDays: 30 - currentStreak
      });
    }

    // Quiz goals
    const totalQuizzes = user.total_quizzes_completed || 0;
    if (totalQuizzes < 10) {
      recommendations.push({
        goal: 'Complete 10 quizzes',
        description: 'Take 10 quizzes to build your knowledge base',
        difficulty: 'easy',
        estimatedDays: Math.ceil((10 - totalQuizzes) / 2) // Assuming 2 quizzes per day
      });
    }

    // XP goals
    const totalXP = user.total_xp || 0;
    const nextMilestone = Math.ceil(totalXP / 1000) * 1000;
    if (nextMilestone - totalXP <= 500) {
      recommendations.push({
        goal: `Reach ${nextMilestone.toLocaleString()} XP`,
        description: `You're ${nextMilestone - totalXP} XP away from this milestone`,
        difficulty: 'easy',
        estimatedDays: Math.ceil((nextMilestone - totalXP) / 50) // Assuming 50 XP per day
      });
    }

    return recommendations.slice(0, 5);
  } catch (error) {
    console.error('Error getting goal recommendations:', error);
    return [];
  }
}

/**
 * Get personalized insights
 */
export async function getPersonalizedInsights(userId: string): Promise<string[]> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('total_xp, streak_count, total_quizzes_completed, average_accuracy')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const insights: string[] = [];

    // Check for cached insights
    const { data: cached } = await supabase
      .from('user_insights')
      .select('content')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(3)
      .maybeSingle();

    if (cached) {
      return [cached.content];
    }

    // Generate simple insights
    const streak = user.streak_count || 0;
    const accuracy = user.average_accuracy || 0;
    const quizzes = user.total_quizzes_completed || 0;

    if (streak >= 7) {
      insights.push(`🔥 You're on a ${streak}-day streak! Keep the momentum going!`);
    }

    if (accuracy >= 85) {
      insights.push(`⭐ Your ${accuracy.toFixed(0)}% accuracy shows you're mastering the content!`);
    }

    if (quizzes >= 50) {
      insights.push(`📚 You've completed ${quizzes} quizzes! That's impressive dedication.`);
    }

    if (streak < 3 && quizzes > 0) {
      insights.push(`💪 Building a streak will help you form lasting habits. Try to complete your routine daily!`);
    }

    return insights;
  } catch (error) {
    console.error('Error getting personalized insights:', error);
    return [];
  }
}

