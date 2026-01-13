/**
 * Badge Service
 * Complete badge system with 20+ badges across multiple categories
 */

import { supabase } from '@/integrations/supabase/client';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'xp' | 'quiz' | 'game' | 'special' | 'topic';
  requirement_type: string;
  requirement_value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface BadgeRequirement {
  type: 'quizzes_completed' | 'streak' | 'total_xp' | 'perfect_quiz' | 'accuracy' | 'games_played' | 'early_bird' | 'night_owl' | 'weekend_warrior' | 'topics_completed' | 'game_score';
  value: number;
  gameType?: string;
}

export interface UserStats {
  totalQuizzes: number;
  currentStreak: number;
  totalXP: number;
  perfectQuizzes: number;
  averageAccuracy: number;
  gamesPlayed: number;
  topicsCompleted: number;
  earlyBirdCount: number;
  nightOwlCount: number;
  weekendWarriorCount: number;
  wordleHighScore: number;
  sudokuHighScore: number;
  game2048HighScore: number;
}

/**
 * Complete list of 25+ badges
 */
export const ALL_BADGES: Badge[] = [
  // STREAK BADGES (7)
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 3,
    rarity: 'common',
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚔️',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 7,
    rarity: 'common',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'fortnight-fighter',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak',
    icon: '🛡️',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 14,
    rarity: 'rare',
    color: 'from-amber-400 to-orange-600'
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 30,
    rarity: 'epic',
    color: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'two-month-titan',
    name: 'Two Month Titan',
    description: 'Maintain a 60-day streak',
    icon: '🏆',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 60,
    rarity: 'epic',
    color: 'from-purple-400 to-pink-600'
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 100,
    rarity: 'legendary',
    color: 'from-cyan-400 to-blue-600'
  },
  {
    id: 'year-legend',
    name: 'Year Legend',
    description: 'Maintain a 365-day streak',
    icon: '🌟',
    category: 'streak',
    requirement_type: 'streak',
    requirement_value: 365,
    rarity: 'legendary',
    color: 'from-yellow-300 to-yellow-600'
  },

  // XP BADGES (6)
  {
    id: 'xp-beginner',
    name: 'XP Beginner',
    description: 'Earn 100 XP',
    icon: '⭐',
    category: 'xp',
    requirement_type: 'total_xp',
    requirement_value: 100,
    rarity: 'common',
    color: 'from-green-400 to-emerald-600'
  },
  {
    id: 'xp-collector',
    name: 'XP Collector',
    description: 'Earn 500 XP',
    icon: '🌟',
    category: 'xp',
    requirement_type: 'total_xp',
    requirement_value: 500,
    rarity: 'common',
    color: 'from-teal-400 to-green-600'
  },
  {
    id: 'xp-hunter',
    name: 'XP Hunter',
    description: 'Earn 1,000 XP',
    icon: '💫',
    category: 'xp',
    requirement_type: 'total_xp',
    requirement_value: 1000,
    rarity: 'rare',
    color: 'from-blue-400 to-indigo-600'
  },
  {
    id: 'xp-master',
    name: 'XP Master',
    description: 'Earn 5,000 XP',
    icon: '✨',
    category: 'xp',
    requirement_type: 'total_xp',
    requirement_value: 5000,
    rarity: 'epic',
    color: 'from-purple-400 to-violet-600'
  },
  {
    id: 'xp-legend',
    name: 'XP Legend',
    description: 'Earn 10,000 XP',
    icon: '🌠',
    category: 'xp',
    requirement_type: 'total_xp',
    requirement_value: 10000,
    rarity: 'epic',
    color: 'from-pink-400 to-rose-600'
  },
  {
    id: 'xp-titan',
    name: 'XP Titan',
    description: 'Earn 50,000 XP',
    icon: '🔮',
    category: 'xp',
    requirement_type: 'total_xp',
    requirement_value: 50000,
    rarity: 'legendary',
    color: 'from-fuchsia-400 to-purple-700'
  },

  // QUIZ BADGES (5)
  {
    id: 'first-quiz',
    name: "Learner's Spark",
    description: 'Complete your first quiz',
    icon: '📚',
    category: 'quiz',
    requirement_type: 'quizzes_completed',
    requirement_value: 1,
    rarity: 'common',
    color: 'from-sky-400 to-blue-600'
  },
  {
    id: 'quiz-enthusiast',
    name: 'Quiz Enthusiast',
    description: 'Complete 10 quizzes',
    icon: '📖',
    category: 'quiz',
    requirement_type: 'quizzes_completed',
    requirement_value: 10,
    rarity: 'common',
    color: 'from-indigo-400 to-blue-600'
  },
  {
    id: 'quiz-veteran',
    name: 'Quiz Veteran',
    description: 'Complete 50 quizzes',
    icon: '🎓',
    category: 'quiz',
    requirement_type: 'quizzes_completed',
    requirement_value: 50,
    rarity: 'rare',
    color: 'from-violet-400 to-purple-600'
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Complete 100 quizzes',
    icon: '🏅',
    category: 'quiz',
    requirement_type: 'quizzes_completed',
    requirement_value: 100,
    rarity: 'epic',
    color: 'from-amber-400 to-yellow-600'
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '💯',
    category: 'quiz',
    requirement_type: 'perfect_quiz',
    requirement_value: 1,
    rarity: 'rare',
    color: 'from-emerald-400 to-green-600'
  },

  // GAME BADGES (4)
  {
    id: 'wordle-master',
    name: 'Word Wizard',
    description: 'Win 10 Wordle games',
    icon: '🔤',
    category: 'game',
    requirement_type: 'games_played',
    requirement_value: 10,
    rarity: 'rare',
    color: 'from-green-400 to-emerald-600'
  },
  {
    id: 'sudoku-solver',
    name: 'Sudoku Solver',
    description: 'Complete 10 Sudoku puzzles',
    icon: '🔢',
    category: 'game',
    requirement_type: 'games_played',
    requirement_value: 10,
    rarity: 'rare',
    color: 'from-blue-400 to-cyan-600'
  },
  {
    id: '2048-champion',
    name: '2048 Champion',
    description: 'Score 2048 or higher in 2048',
    icon: '🎮',
    category: 'game',
    requirement_type: 'game_score',
    requirement_value: 2048,
    rarity: 'epic',
    color: 'from-amber-400 to-orange-600'
  },
  {
    id: 'game-addict',
    name: 'Game Addict',
    description: 'Play 50 games total',
    icon: '🎯',
    category: 'game',
    requirement_type: 'games_played',
    requirement_value: 50,
    rarity: 'epic',
    color: 'from-rose-400 to-red-600'
  },

  // SPECIAL BADGES (5)
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete activity before 8 AM (5 times)',
    icon: '🌅',
    category: 'special',
    requirement_type: 'early_bird',
    requirement_value: 5,
    rarity: 'rare',
    color: 'from-orange-300 to-amber-500'
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete activity after 10 PM (5 times)',
    icon: '🦉',
    category: 'special',
    requirement_type: 'night_owl',
    requirement_value: 5,
    rarity: 'rare',
    color: 'from-indigo-500 to-purple-700'
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 weekend sessions',
    icon: '🎉',
    category: 'special',
    requirement_type: 'weekend_warrior',
    requirement_value: 10,
    rarity: 'rare',
    color: 'from-pink-400 to-rose-600'
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Achieve 90%+ accuracy across 20 quizzes',
    icon: '🎖️',
    category: 'special',
    requirement_type: 'accuracy',
    requirement_value: 90,
    rarity: 'epic',
    color: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'topic-explorer',
    name: 'Topic Explorer',
    description: 'Complete quizzes in 5 different topics',
    icon: '🗺️',
    category: 'topic',
    requirement_type: 'topics_completed',
    requirement_value: 5,
    rarity: 'rare',
    color: 'from-teal-400 to-cyan-600'
  },
];

/**
 * Badge requirements mapping for quick lookup
 */
export const BADGE_REQUIREMENTS: Record<string, BadgeRequirement> = ALL_BADGES.reduce((acc, badge) => {
  acc[badge.id] = {
    type: badge.requirement_type as BadgeRequirement['type'],
    value: badge.requirement_value
  };
  return acc;
}, {} as Record<string, BadgeRequirement>);

/**
 * Get default user stats
 */
export function getDefaultUserStats(): UserStats {
  return {
    totalQuizzes: 0,
    currentStreak: 0,
    totalXP: 0,
    perfectQuizzes: 0,
    averageAccuracy: 0,
    gamesPlayed: 0,
    topicsCompleted: 0,
    earlyBirdCount: 0,
    nightOwlCount: 0,
    weekendWarriorCount: 0,
    wordleHighScore: 0,
    sudokuHighScore: 0,
    game2048HighScore: 0
  };
}

/**
 * Check if user qualifies for a specific badge
 */
export function checkBadgeEligibility(
  badge: Badge,
  userStats: UserStats
): boolean {
  const requirement = BADGE_REQUIREMENTS[badge.id];
  if (!requirement) return false;

  switch (requirement.type) {
    case 'quizzes_completed':
      return userStats.totalQuizzes >= requirement.value;
    case 'streak':
      return userStats.currentStreak >= requirement.value;
    case 'total_xp':
      return userStats.totalXP >= requirement.value;
    case 'perfect_quiz':
      return userStats.perfectQuizzes >= requirement.value;
    case 'accuracy':
      return userStats.averageAccuracy >= requirement.value;
    case 'games_played':
      return userStats.gamesPlayed >= requirement.value;
    case 'early_bird':
      return userStats.earlyBirdCount >= requirement.value;
    case 'night_owl':
      return userStats.nightOwlCount >= requirement.value;
    case 'weekend_warrior':
      return userStats.weekendWarriorCount >= requirement.value;
    case 'topics_completed':
      return userStats.topicsCompleted >= requirement.value;
    case 'game_score':
      return userStats.game2048HighScore >= requirement.value;
    default:
      return false;
  }
}

/**
 * Award a badge to a user
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString()
      });
    
    return !error;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

/**
 * Check if user already has a specific badge
 */
export async function checkIfBadgeAlreadyEarned(userId: string, badgeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .maybeSingle();
    
    return !!data && !error;
  } catch (error) {
    console.error('Error checking badge:', error);
    return false;
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(b => b.badge_id) || [];
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

/**
 * Get user stats from database
 */
export async function getUserStatsForBadges(userId: string): Promise<UserStats> {
  const stats = getDefaultUserStats();
  
  try {
    // Get user data (streak, XP)
    const { data: userData } = await supabase
      .from('users')
      .select('streak_count, total_xp')
      .eq('id', userId)
      .single();
    
    if (userData) {
      stats.currentStreak = userData.streak_count || 0;
      stats.totalXP = userData.total_xp || 0;
    }

    // Get quiz attempts
    const { data: quizData } = await supabase
      .from('quiz_attempts')
      .select('score, total_questions')
      .eq('user_id', userId);
    
    if (quizData) {
      stats.totalQuizzes = quizData.length;
      stats.perfectQuizzes = quizData.filter(q => q.score === q.total_questions).length;
      if (quizData.length > 0) {
        const totalAccuracy = quizData.reduce((acc, q) => {
          return acc + (q.score / q.total_questions) * 100;
        }, 0);
        stats.averageAccuracy = totalAccuracy / quizData.length;
      }
    }

    // Get game scores
    const { data: gameData } = await supabase
      .from('game_scores')
      .select('game_type, score')
      .eq('user_id', userId);
    
    if (gameData) {
      stats.gamesPlayed = gameData.length;
      stats.game2048HighScore = Math.max(
        0,
        ...gameData.filter(g => g.game_type === '2048').map(g => g.score)
      );
    }

    // Get unique topics
    const { data: topicData } = await supabase
      .from('user_topics')
      .select('topic_id')
      .eq('user_id', userId);
    
    if (topicData) {
      stats.topicsCompleted = topicData.length;
    }

  } catch (error) {
    console.error('Error fetching user stats:', error);
  }
  
  return stats;
}

/**
 * Check and award all eligible badges for a user
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const newBadges: Badge[] = [];
  
  try {
    const userStats = await getUserStatsForBadges(userId);
    const earnedBadgeIds = await getUserBadges(userId);
    
    for (const badge of ALL_BADGES) {
      // Skip if already earned
      if (earnedBadgeIds.includes(badge.id)) continue;
      
      // Check eligibility
      if (checkBadgeEligibility(badge, userStats)) {
        const awarded = await awardBadge(userId, badge.id);
        if (awarded) {
          newBadges.push(badge);
        }
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
  
  return newBadges;
}

/**
 * Get all available badges
 */
export function getAllBadges(): Badge[] {
  return ALL_BADGES;
}

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return ALL_BADGES.find(b => b.id === badgeId);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return ALL_BADGES.filter(b => b.category === category);
}

/**
 * Get badge progress for display
 */
export function getBadgeProgress(
  badge: Badge,
  userStats: UserStats
): { current: number; required: number; percentage: number } {
  const requirement = BADGE_REQUIREMENTS[badge.id];
  if (!requirement) return { current: 0, required: 0, percentage: 0 };

  let current = 0;
  switch (requirement.type) {
    case 'quizzes_completed':
      current = userStats.totalQuizzes;
      break;
    case 'streak':
      current = userStats.currentStreak;
      break;
    case 'total_xp':
      current = userStats.totalXP;
      break;
    case 'perfect_quiz':
      current = userStats.perfectQuizzes;
      break;
    case 'accuracy':
      current = Math.round(userStats.averageAccuracy);
      break;
    case 'games_played':
      current = userStats.gamesPlayed;
      break;
    case 'early_bird':
      current = userStats.earlyBirdCount;
      break;
    case 'night_owl':
      current = userStats.nightOwlCount;
      break;
    case 'weekend_warrior':
      current = userStats.weekendWarriorCount;
      break;
    case 'topics_completed':
      current = userStats.topicsCompleted;
      break;
    case 'game_score':
      current = userStats.game2048HighScore;
      break;
  }

  const percentage = Math.min(100, Math.round((current / requirement.value) * 100));
  
  return {
    current: Math.min(current, requirement.value),
    required: requirement.value,
    percentage
  };
}

/**
 * Calculate XP earned from quiz completion
 */
export function calculateQuizXP(
  score: number,
  totalQuestions: number,
  isPerfect: boolean,
  currentStreak: number
): number {
  const baseXP = score * 10; // 10 XP per correct answer
  const perfectBonus = isPerfect ? 20 : 0;
  const streakBonus = getStreakBonus(currentStreak);
  
  return baseXP + perfectBonus + streakBonus;
}

/**
 * Get streak bonus XP
 */
export function getStreakBonus(streak: number): number {
  if (streak >= 100) return 100;
  if (streak >= 60) return 75;
  if (streak >= 30) return 50;
  if (streak >= 14) return 30;
  if (streak >= 7) return 20;
  if (streak >= 3) return 10;
  return 0;
}

/**
 * Format badge notification message
 */
export function formatBadgeNotification(badge: Badge): string {
  return `🎉 Congratulations! You earned the "${badge.name}" badge! ${badge.icon}`;
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'border-gray-400';
    case 'rare':
      return 'border-blue-500';
    case 'epic':
      return 'border-purple-500';
    case 'legendary':
      return 'border-yellow-500';
    default:
      return 'border-gray-400';
  }
}

/**
 * Get rarity label
 */
export function getRarityLabel(rarity: Badge['rarity']): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
