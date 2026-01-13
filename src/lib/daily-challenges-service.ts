/**
 * Daily Challenges Service
 * Manages daily and weekly challenges with progress tracking
 */

import { supabase } from '@/integrations/supabase/client';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'quiz' | 'streak' | 'game' | 'xp' | 'perfect' | 'time';
  target_value: number;
  xp_reward: number;
  icon: string;
  is_active: boolean;
}

export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  date: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  xp_claimed: boolean;
  challenge?: DailyChallenge;
}

export interface ChallengeWithProgress extends DailyChallenge {
  progress: number;
  completed: boolean;
  xp_claimed: boolean;
  percentage: number;
}

// Default challenges for fallback
const DEFAULT_CHALLENGES: DailyChallenge[] = [
  {
    id: 'quiz-champion',
    title: 'Quiz Champion',
    description: 'Complete 2 quizzes today',
    challenge_type: 'quiz',
    target_value: 2,
    xp_reward: 50,
    icon: '📚',
    is_active: true
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Get 100% on any quiz',
    challenge_type: 'perfect',
    target_value: 1,
    xp_reward: 75,
    icon: '💯',
    is_active: true
  },
  {
    id: 'game-master',
    title: 'Game Master',
    description: 'Play 3 games today',
    challenge_type: 'game',
    target_value: 3,
    xp_reward: 50,
    icon: '🎮',
    is_active: true
  },
  {
    id: 'xp-hunter',
    title: 'XP Hunter',
    description: 'Earn 100 XP today',
    challenge_type: 'xp',
    target_value: 100,
    xp_reward: 50,
    icon: '⚡',
    is_active: true
  },
  {
    id: 'streak-keeper',
    title: 'Streak Keeper',
    description: 'Maintain your streak',
    challenge_type: 'streak',
    target_value: 1,
    xp_reward: 40,
    icon: '🔥',
    is_active: true
  }
];

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get 3 random daily challenges for today
 */
export async function getDailyChallenges(): Promise<DailyChallenge[]> {
  try {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Seed-based random selection for consistency within a day
      const today = getToday();
      const seed = today.split('-').join('');
      const shuffled = [...data].sort((a, b) => {
        const hashA = (parseInt(seed) + a.id.charCodeAt(0)) % 1000;
        const hashB = (parseInt(seed) + b.id.charCodeAt(0)) % 1000;
        return hashA - hashB;
      });
      
      return shuffled.slice(0, 3) as DailyChallenge[];
    }
    
    // Fallback to default challenges
    return DEFAULT_CHALLENGES.slice(0, 3);
  } catch (error) {
    console.error('Error fetching daily challenges:', error);
    return DEFAULT_CHALLENGES.slice(0, 3);
  }
}

/**
 * Get user's progress on today's challenges
 */
export async function getUserChallengeProgress(userId: string): Promise<Map<string, UserChallengeProgress>> {
  const progressMap = new Map<string, UserChallengeProgress>();
  
  try {
    const today = getToday();
    
    const { data, error } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);
    
    if (error) throw error;
    
    if (data) {
      data.forEach(progress => {
        progressMap.set(progress.challenge_id, progress as UserChallengeProgress);
      });
    }
  } catch (error) {
    console.error('Error fetching challenge progress:', error);
  }
  
  return progressMap;
}

/**
 * Get challenges with user progress combined
 */
export async function getChallengesWithProgress(userId: string): Promise<ChallengeWithProgress[]> {
  const [challenges, progressMap] = await Promise.all([
    getDailyChallenges(),
    getUserChallengeProgress(userId)
  ]);
  
  return challenges.map(challenge => {
    const progress = progressMap.get(challenge.id);
    const currentProgress = progress?.progress || 0;
    const percentage = Math.min(100, (currentProgress / challenge.target_value) * 100);
    
    return {
      ...challenge,
      progress: currentProgress,
      completed: progress?.completed || false,
      xp_claimed: progress?.xp_claimed || false,
      percentage
    };
  });
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progressIncrement: number = 1
): Promise<{ success: boolean; completed: boolean; newProgress: number }> {
  try {
    const today = getToday();
    
    // Get current progress
    const { data: existing } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('date', today)
      .maybeSingle();
    
    // Get challenge details
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('target_value')
      .eq('id', challengeId)
      .single();
    
    const targetValue = challenge?.target_value || 1;
    const currentProgress = existing?.progress || 0;
    const newProgress = currentProgress + progressIncrement;
    const isCompleted = newProgress >= targetValue;
    
    if (existing) {
      // Update existing progress
      const { error } = await supabase
        .from('user_daily_challenges')
        .update({
          progress: newProgress,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Create new progress entry
      const { error } = await supabase
        .from('user_daily_challenges')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          date: today,
          progress: newProgress,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        });
      
      if (error) throw error;
    }
    
    return { success: true, completed: isCompleted, newProgress };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { success: false, completed: false, newProgress: 0 };
  }
}

/**
 * Claim XP reward for completed challenge
 */
export async function claimChallengeReward(
  userId: string,
  challengeId: string
): Promise<{ success: boolean; xpAwarded: number }> {
  try {
    const today = getToday();
    
    // Get progress and challenge info
    const { data: progress } = await supabase
      .from('user_daily_challenges')
      .select('*, daily_challenges(*)')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('date', today)
      .single();
    
    if (!progress || !progress.completed || progress.xp_claimed) {
      return { success: false, xpAwarded: 0 };
    }
    
    const xpReward = (progress.daily_challenges as any)?.xp_reward || 50;
    
    // Mark as claimed
    const { error: updateError } = await supabase
      .from('user_daily_challenges')
      .update({ xp_claimed: true })
      .eq('id', progress.id);
    
    if (updateError) throw updateError;
    
    // Award XP to user
    const { error: xpError } = await supabase.rpc('increment_user_xp', {
      user_id_param: userId,
      xp_amount: xpReward
    });
    
    // If RPC doesn't exist, update directly
    if (xpError) {
      const { data: userData } = await supabase
        .from('users')
        .select('total_xp')
        .eq('id', userId)
        .single();
      
      if (userData) {
        await supabase
          .from('users')
          .update({ total_xp: (userData.total_xp || 0) + xpReward })
          .eq('id', userId);
      }
    }
    
    return { success: true, xpAwarded: xpReward };
  } catch (error) {
    console.error('Error claiming challenge reward:', error);
    return { success: false, xpAwarded: 0 };
  }
}

/**
 * Auto-update challenges based on user activity
 * Call this after quiz completion, game play, etc.
 */
export async function trackChallengeActivity(
  userId: string,
  activityType: 'quiz' | 'game' | 'xp' | 'perfect' | 'streak',
  value: number = 1
): Promise<void> {
  try {
    const challenges = await getDailyChallenges();
    
    for (const challenge of challenges) {
      if (challenge.challenge_type === activityType) {
        await updateChallengeProgress(userId, challenge.id, value);
      }
    }
  } catch (error) {
    console.error('Error tracking challenge activity:', error);
  }
}

/**
 * Get challenge completion stats
 */
export async function getChallengeStats(userId: string): Promise<{
  completedToday: number;
  totalToday: number;
  streakDays: number;
  totalCompleted: number;
}> {
  try {
    const today = getToday();
    
    // Today's stats
    const { data: todayData } = await supabase
      .from('user_daily_challenges')
      .select('completed')
      .eq('user_id', userId)
      .eq('date', today);
    
    const completedToday = todayData?.filter(c => c.completed).length || 0;
    
    // Total completed all time
    const { count: totalCompleted } = await supabase
      .from('user_daily_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);
    
    return {
      completedToday,
      totalToday: 3, // We show 3 challenges per day
      streakDays: 0, // Would need additional logic for challenge streaks
      totalCompleted: totalCompleted || 0
    };
  } catch (error) {
    console.error('Error getting challenge stats:', error);
    return { completedToday: 0, totalToday: 3, streakDays: 0, totalCompleted: 0 };
  }
}

