/**
 * Streak Management Utilities
 * Handles streak calculation, validation, and streak freeze logic
 */

export interface StreakData {
  currentStreak: number;
  lastQuizDate: string | null;
  canTakeQuizToday: boolean;
  streakBroken: boolean;
  nextUnlockTime: Date;
}

/**
 * Calculate user's current streak based on quiz completion history
 */
export function calculateStreak(
  lastQuizDate: string | null,
  today: Date = new Date()
): StreakData {
  const now = today;
  const todayStr = formatDateForStreak(now);
  
  // If no previous quiz, streak is 0
  if (!lastQuizDate) {
    return {
      currentStreak: 0,
      lastQuizDate: null,
      canTakeQuizToday: true,
      streakBroken: false,
      nextUnlockTime: getNextUnlockTime(now)
    };
  }

  const lastQuiz = new Date(lastQuizDate);
  const daysSinceLastQuiz = Math.floor((now.getTime() - lastQuiz.getTime()) / (1000 * 60 * 60 * 24));
  
  // If last quiz was today, they can't take another quiz today
  if (daysSinceLastQuiz === 0) {
    return {
      currentStreak: 0, // Will be calculated from database
      lastQuizDate,
      canTakeQuizToday: false,
      streakBroken: false,
      nextUnlockTime: getNextUnlockTime(now)
    };
  }

  // If last quiz was yesterday, streak continues
  if (daysSinceLastQuiz === 1) {
    return {
      currentStreak: 0, // Will be calculated from database
      lastQuizDate,
      canTakeQuizToday: true,
      streakBroken: false,
      nextUnlockTime: getNextUnlockTime(now)
    };
  }

  // If more than 1 day has passed, streak is broken
  return {
    currentStreak: 0,
    lastQuizDate,
    canTakeQuizToday: true,
    streakBroken: true,
    nextUnlockTime: getNextUnlockTime(now)
  };
}

/**
 * Get the next 7 AM ET unlock time
 */
export function getNextUnlockTime(now: Date = new Date()): Date {
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const today7AM = new Date(et);
  today7AM.setHours(7, 0, 0, 0);
  
  // If it's already past 7 AM ET today, next unlock is tomorrow at 7 AM ET
  if (now.getTime() >= today7AM.getTime()) {
    const tomorrow = new Date(today7AM);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  return today7AM;
}

/**
 * Format date for streak comparison (YYYY-MM-DD)
 */
function formatDateForStreak(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if user completed quizzes yesterday
 */
export function completedQuizzesYesterday(lastQuizDate: string | null): boolean {
  if (!lastQuizDate) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateForStreak(yesterday);
  
  return lastQuizDate === yesterdayStr;
}

/**
 * Check if user completed quizzes today
 */
export function completedQuizzesToday(lastQuizDate: string | null): boolean {
  if (!lastQuizDate) return false;
  
  const today = new Date();
  const todayStr = formatDateForStreak(today);
  
  return lastQuizDate === todayStr;
}

/**
 * Calculate time until next unlock in hours and minutes
 */
export function getTimeUntilNextUnlock(now: Date = new Date()): { hours: number; minutes: number } {
  const nextUnlock = getNextUnlockTime(now);
  const diffMs = nextUnlock.getTime() - now.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
}

/**
 * Format countdown string (e.g., "13h 47m")
 */
export function formatCountdown(hours: number, minutes: number): string {
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Check if streak should be incremented
 */
export function shouldIncrementStreak(
  lastQuizDate: string | null,
  completedYesterday: boolean
): boolean {
  if (!lastQuizDate) return true; // First quiz ever
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateForStreak(yesterday);
  
  return lastQuizDate === yesterdayStr || completedYesterday;
}

/**
 * Calculate XP bonus for streak milestones
 */
export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 50; // 30+ day streak bonus
  if (streak >= 7) return 20;  // 7+ day streak bonus
  if (streak >= 3) return 10;  // 3+ day streak bonus
  return 0;
}
