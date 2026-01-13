/**
 * Level Service
 * Handles user level calculations, XP requirements, and level rewards
 */

import { supabase } from '@/integrations/supabase/client';

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  xpNeeded: number;
  progressPercentage: number;
  title: string;
  rewards: LevelReward[];
}

export interface LevelReward {
  type: 'theme' | 'badge' | 'feature' | 'title';
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

/**
 * Level titles by level range
 */
const LEVEL_TITLES: Record<number, string> = {
  1: 'Beginner',
  5: 'Apprentice',
  10: 'Student',
  15: 'Scholar',
  20: 'Expert',
  25: 'Master',
  30: 'Sage',
  40: 'Grandmaster',
  50: 'Legend',
  75: 'Mythic',
  100: 'Immortal'
};

/**
 * Level rewards configuration
 */
const LEVEL_REWARDS: Record<number, LevelReward[]> = {
  5: [
    { type: 'theme', name: 'Ocean Theme', description: 'Unlock the calming ocean theme', icon: '🌊', unlocked: false },
  ],
  10: [
    { type: 'feature', name: 'Streak Freeze', description: 'Earn your first streak freeze', icon: '❄️', unlocked: false },
    { type: 'title', name: 'Student', description: 'New profile title unlocked', icon: '📖', unlocked: false },
  ],
  15: [
    { type: 'theme', name: 'Forest Theme', description: 'Unlock the peaceful forest theme', icon: '🌲', unlocked: false },
  ],
  20: [
    { type: 'feature', name: 'Double XP', description: 'Earn a Double XP boost', icon: '⚡', unlocked: false },
    { type: 'title', name: 'Expert', description: 'New profile title unlocked', icon: '🎓', unlocked: false },
  ],
  25: [
    { type: 'theme', name: 'Space Theme', description: 'Unlock the cosmic space theme', icon: '🚀', unlocked: false },
  ],
  30: [
    { type: 'badge', name: 'Sage Badge', description: 'Special Sage badge unlocked', icon: '🧙', unlocked: false },
    { type: 'title', name: 'Sage', description: 'New profile title unlocked', icon: '📿', unlocked: false },
  ],
  50: [
    { type: 'theme', name: 'Golden Theme', description: 'Unlock the prestigious golden theme', icon: '✨', unlocked: false },
    { type: 'title', name: 'Legend', description: 'New profile title unlocked', icon: '👑', unlocked: false },
  ],
  100: [
    { type: 'badge', name: 'Immortal Badge', description: 'The rarest badge of all', icon: '💎', unlocked: false },
    { type: 'title', name: 'Immortal', description: 'The ultimate title', icon: '🌟', unlocked: false },
  ],
};

/**
 * Calculate XP required for a specific level
 * Uses a smooth exponential curve
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  // Formula: XP = 50 * (2^(level-1) - 1)
  // Level 2 = 50, Level 3 = 150, Level 5 = 750, Level 10 = 25,550
  return Math.floor(50 * (Math.pow(1.5, level - 1) - 1));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  if (totalXP <= 0) return 1;
  // Inverse of the XP formula
  // level = log1.5((xp/50) + 1) + 1
  return Math.floor(Math.log(totalXP / 50 + 1) / Math.log(1.5)) + 1;
}

/**
 * Get title for a specific level
 */
export function getTitleForLevel(level: number): string {
  const titles = Object.entries(LEVEL_TITLES)
    .map(([lvl, title]) => ({ level: parseInt(lvl), title }))
    .sort((a, b) => b.level - a.level);
  
  for (const { level: lvl, title } of titles) {
    if (level >= lvl) return title;
  }
  return 'Beginner';
}

/**
 * Get rewards for a specific level
 */
export function getRewardsForLevel(level: number): LevelReward[] {
  return LEVEL_REWARDS[level] || [];
}

/**
 * Get all rewards up to and including current level
 */
export function getAllUnlockedRewards(currentLevel: number): LevelReward[] {
  const rewards: LevelReward[] = [];
  
  for (const [lvl, levelRewards] of Object.entries(LEVEL_REWARDS)) {
    const level = parseInt(lvl);
    if (level <= currentLevel) {
      rewards.push(...levelRewards.map(r => ({ ...r, unlocked: true })));
    }
  }
  
  return rewards;
}

/**
 * Get upcoming rewards (next 3 milestone levels)
 */
export function getUpcomingRewards(currentLevel: number): { level: number; rewards: LevelReward[] }[] {
  const upcoming: { level: number; rewards: LevelReward[] }[] = [];
  
  const levels = Object.keys(LEVEL_REWARDS).map(Number).sort((a, b) => a - b);
  
  for (const level of levels) {
    if (level > currentLevel && upcoming.length < 3) {
      upcoming.push({
        level,
        rewards: LEVEL_REWARDS[level].map(r => ({ ...r, unlocked: false }))
      });
    }
  }
  
  return upcoming;
}

/**
 * Get complete level info for a user
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const level = getLevelFromXP(totalXP);
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeeded > 0 ? Math.min(100, (xpProgress / xpNeeded) * 100) : 100;
  
  return {
    level,
    currentXP: totalXP,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded,
    progressPercentage,
    title: getTitleForLevel(level),
    rewards: getAllUnlockedRewards(level)
  };
}

/**
 * Check if user leveled up after gaining XP
 */
export function checkLevelUp(previousXP: number, newXP: number): { leveledUp: boolean; newLevel: number; rewards: LevelReward[] } {
  const previousLevel = getLevelFromXP(previousXP);
  const newLevel = getLevelFromXP(newXP);
  
  if (newLevel > previousLevel) {
    // Collect all rewards from levels gained
    const rewards: LevelReward[] = [];
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      rewards.push(...getRewardsForLevel(level));
    }
    
    return {
      leveledUp: true,
      newLevel,
      rewards: rewards.map(r => ({ ...r, unlocked: true }))
    };
  }
  
  return { leveledUp: false, newLevel, rewards: [] };
}

/**
 * Get user's level info from database
 */
export async function getUserLevelInfo(userId: string): Promise<LevelInfo | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    return getLevelInfo(data.total_xp || 0);
  } catch (error) {
    console.error('Error getting user level info:', error);
    return null;
  }
}

/**
 * Award XP to user and check for level up
 */
export async function awardXP(
  userId: string, 
  xpAmount: number
): Promise<{ success: boolean; levelUp: { leveledUp: boolean; newLevel: number; rewards: LevelReward[] } | null }> {
  try {
    // Get current XP
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single();
    
    if (fetchError || !userData) {
      return { success: false, levelUp: null };
    }
    
    const previousXP = userData.total_xp || 0;
    const newXP = previousXP + xpAmount;
    
    // Update XP
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_xp: newXP })
      .eq('id', userId);
    
    if (updateError) {
      return { success: false, levelUp: null };
    }
    
    // Check for level up
    const levelUp = checkLevelUp(previousXP, newXP);
    
    return { success: true, levelUp };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return { success: false, levelUp: null };
  }
}

/**
 * XP requirements preview (for display)
 */
export function getXPRequirementsPreview(): { level: number; xp: number; title: string }[] {
  return [
    { level: 1, xp: 0, title: 'Beginner' },
    { level: 5, xp: getXPForLevel(5), title: 'Apprentice' },
    { level: 10, xp: getXPForLevel(10), title: 'Student' },
    { level: 20, xp: getXPForLevel(20), title: 'Expert' },
    { level: 30, xp: getXPForLevel(30), title: 'Sage' },
    { level: 50, xp: getXPForLevel(50), title: 'Legend' },
    { level: 100, xp: getXPForLevel(100), title: 'Immortal' },
  ];
}

