/**
 * Celebration Service
 * Manages celebration triggers for badges, level ups, streaks, and achievements
 */

import { Badge, checkAndAwardBadges } from './badge-service';
import { checkLevelUp, getLevelInfo } from './level-service';
import { supabase } from '@/integrations/supabase/client';

export interface CelebrationEvent {
  type: 'badge' | 'level' | 'streak' | 'achievement';
  data: {
    badge?: Badge;
    level?: number;
    streak?: number;
    title?: string;
    subtitle?: string;
    xpReward?: number;
  };
}

/**
 * Check for celebrations after XP gain
 */
export async function checkCelebrationsAfterXP(
  userId: string,
  previousXP: number,
  newXP: number
): Promise<CelebrationEvent[]> {
  const celebrations: CelebrationEvent[] = [];

  // Check for level up
  const levelUp = checkLevelUp(previousXP, newXP);
  if (levelUp.leveledUp) {
    celebrations.push({
      type: 'level',
      data: {
        level: levelUp.newLevel,
        xpReward: 0,
        subtitle: `You've unlocked new features!`
      }
    });
  }

  // Check for new badges
  const newBadges = await checkAndAwardBadges(userId);
  for (const badge of newBadges) {
    celebrations.push({
      type: 'badge',
      data: {
        badge,
        xpReward: getBadgeXPReward(badge.rarity)
      }
    });
  }

  return celebrations;
}

/**
 * Check for streak milestone celebrations
 */
export async function checkStreakCelebration(
  userId: string,
  streakDays: number
): Promise<CelebrationEvent | null> {
  const milestones = [7, 14, 30, 60, 100, 365];
  
  if (milestones.includes(streakDays)) {
    // Check if this milestone was already celebrated
    const { data: lastCelebration } = await supabase
      .from('user_achievements')
      .select('achieved_at')
      .eq('user_id', userId)
      .eq('achievement_type', `streak_${streakDays}`)
      .order('achieved_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastCelebration) {
      return {
        type: 'streak',
        data: {
          streak: streakDays,
          xpReward: getStreakXPReward(streakDays),
          subtitle: getStreakMessage(streakDays)
        }
      };
    }
  }

  return null;
}

/**
 * Get XP reward for badge rarity
 */
function getBadgeXPReward(rarity: string): number {
  switch (rarity) {
    case 'legendary': return 500;
    case 'epic': return 250;
    case 'rare': return 100;
    default: return 50;
  }
}

/**
 * Get XP reward for streak milestone
 */
function getStreakXPReward(days: number): number {
  if (days >= 365) return 1000;
  if (days >= 100) return 500;
  if (days >= 60) return 300;
  if (days >= 30) return 200;
  if (days >= 14) return 100;
  return 50;
}

/**
 * Get streak celebration message
 */
function getStreakMessage(days: number): string {
  if (days >= 365) return "A full year of consistency! You're unstoppable!";
  if (days >= 100) return "100 days strong! You're a legend!";
  if (days >= 60) return "60 days of dedication! Keep it up!";
  if (days >= 30) return "A full month! You're building amazing habits!";
  if (days >= 14) return "Two weeks strong! You're on fire!";
  return "One week down! Great start!";
}

/**
 * Check for perfect quiz celebration
 */
export function checkPerfectQuizCelebration(accuracy: number): CelebrationEvent | null {
  if (accuracy === 100) {
    return {
      type: 'achievement',
      data: {
        title: 'Perfect Score!',
        subtitle: 'You got every question right!',
        xpReward: 50
      }
    };
  }
  return null;
}

