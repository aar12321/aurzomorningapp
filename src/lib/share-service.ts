/**
 * Share Service
 * Handles social sharing of badges, achievements, and progress
 */

import { Badge } from './badge-service';

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  image?: string;
}

/**
 * Check if Web Share API is available
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Share using Web Share API (mobile-friendly)
 */
export async function shareNative(data: ShareData): Promise<boolean> {
  if (!canShare()) return false;

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url || window.location.origin
    });
    return true;
  } catch (error) {
    // User cancelled or error
    console.log('Share cancelled or failed:', error);
    return false;
  }
}

/**
 * Copy to clipboard as fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Generate share text for a badge
 */
export function generateBadgeShareText(badge: Badge, userName?: string): string {
  const name = userName || 'I';
  return `${badge.icon} ${name} just earned the "${badge.name}" badge on Aurzo Morning! 🎉\n\n${badge.description}\n\nStart your morning routine: ${window.location.origin}`;
}

/**
 * Generate share text for a streak milestone
 */
export function generateStreakShareText(streakDays: number, userName?: string): string {
  const name = userName || 'I';
  const emoji = streakDays >= 100 ? '💎' : streakDays >= 30 ? '👑' : streakDays >= 7 ? '🔥' : '⚡';
  return `${emoji} ${name} just hit a ${streakDays}-day streak on Aurzo Morning!\n\nBuilding better habits, one morning at a time.\n\nJoin me: ${window.location.origin}`;
}

/**
 * Generate share text for level up
 */
export function generateLevelUpShareText(level: number, title: string, userName?: string): string {
  const name = userName || 'I';
  return `⬆️ ${name} just reached Level ${level} (${title}) on Aurzo Morning! 🌟\n\nLearning something new every day.\n\nStart your journey: ${window.location.origin}`;
}

/**
 * Generate share text for XP milestone
 */
export function generateXPShareText(totalXP: number, userName?: string): string {
  const name = userName || 'I';
  return `⚡ ${name} just hit ${totalXP.toLocaleString()} XP on Aurzo Morning!\n\nGrowing smarter every morning.\n\nJoin the journey: ${window.location.origin}`;
}

/**
 * Generate share text for game high score
 */
export function generateGameScoreShareText(
  gameName: string, 
  score: number, 
  userName?: string
): string {
  const name = userName || 'I';
  const gameEmoji = {
    'Wordle': '🔤',
    '2048': '🎮',
    'Sudoku': '🔢',
    'Descramble': '🔀'
  }[gameName] || '🎯';
  
  return `${gameEmoji} ${name} just scored ${score.toLocaleString()} in ${gameName} on Aurzo Morning!\n\nCan you beat it?\n\nPlay now: ${window.location.origin}/games`;
}

/**
 * Share a badge
 */
export async function shareBadge(badge: Badge, userName?: string): Promise<boolean> {
  const text = generateBadgeShareText(badge, userName);
  
  if (canShare()) {
    return shareNative({
      title: `I earned ${badge.name}!`,
      text,
      url: window.location.origin
    });
  }
  
  return copyToClipboard(text);
}

/**
 * Share a streak milestone
 */
export async function shareStreak(streakDays: number, userName?: string): Promise<boolean> {
  const text = generateStreakShareText(streakDays, userName);
  
  if (canShare()) {
    return shareNative({
      title: `${streakDays}-Day Streak!`,
      text,
      url: window.location.origin
    });
  }
  
  return copyToClipboard(text);
}

/**
 * Share level up
 */
export async function shareLevelUp(level: number, title: string, userName?: string): Promise<boolean> {
  const text = generateLevelUpShareText(level, title, userName);
  
  if (canShare()) {
    return shareNative({
      title: `Level ${level} - ${title}`,
      text,
      url: window.location.origin
    });
  }
  
  return copyToClipboard(text);
}

/**
 * Share game score
 */
export async function shareGameScore(gameName: string, score: number, userName?: string): Promise<boolean> {
  const text = generateGameScoreShareText(gameName, score, userName);
  
  if (canShare()) {
    return shareNative({
      title: `${gameName} High Score: ${score}`,
      text,
      url: `${window.location.origin}/games`
    });
  }
  
  return copyToClipboard(text);
}

/**
 * Open Twitter share dialog
 */
export function shareToTwitter(text: string): void {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'width=550,height=420');
}

/**
 * Open Facebook share dialog
 */
export function shareToFacebook(url: string = window.location.origin): void {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Open LinkedIn share dialog
 */
export function shareToLinkedIn(url: string = window.location.origin, title?: string): void {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Share via WhatsApp
 */
export function shareToWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

