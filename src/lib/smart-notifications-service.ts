/**
 * Smart Notifications Service
 * Manages intelligent notification timing and delivery
 */

import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreference {
  userId: string;
  optimalTime?: string; // HH:MM format
  streakReminders: boolean;
  achievementNotifications: boolean;
  friendActivity: boolean;
  dailyReminder: boolean;
  reminderTime?: string; // HH:MM format
}

/**
 * Get user's optimal learning time
 */
export async function getUserOptimalTime(userId: string): Promise<string | null> {
  try {
    // Get quiz history to determine best performance time
    const { data: quizHistory } = await supabase
      .from('quiz_results')
      .select('created_at, accuracy')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!quizHistory || quizHistory.length === 0) {
      return '08:00'; // Default morning time
    }

    // Group by hour and calculate average accuracy
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

    return `${bestHour.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error getting optimal time:', error);
    return '08:00';
  }
}

/**
 * Check if user should receive streak reminder
 */
export async function shouldSendStreakReminder(userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('streak_count, last_activity_date')
      .eq('id', userId)
      .single();

    if (!user) return false;

    // Check if streak is at risk (no activity today and has a streak)
    if (user.streak_count && user.streak_count > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = user.last_activity_date ? new Date(user.last_activity_date) : null;
      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
        const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send reminder if no activity today and it's past optimal time
        if (daysSinceActivity >= 1) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking streak reminder:', error);
    return false;
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
  try {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      return {
        userId: data.user_id,
        optimalTime: data.optimal_time,
        streakReminders: data.streak_reminders ?? true,
        achievementNotifications: data.achievement_notifications ?? true,
        friendActivity: data.friend_activity ?? true,
        dailyReminder: data.daily_reminder ?? true,
        reminderTime: data.reminder_time
      };
    }

    // Return defaults
    return {
      userId,
      streakReminders: true,
      achievementNotifications: true,
      friendActivity: true,
      dailyReminder: true,
      reminderTime: '08:00'
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreference>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        optimal_time: preferences.optimalTime,
        streak_reminders: preferences.streakReminders,
        achievement_notifications: preferences.achievementNotifications,
        friend_activity: preferences.friendActivity,
        daily_reminder: preferences.dailyReminder,
        reminder_time: preferences.reminderTime,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    return !error;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Schedule notification (for PWA push notifications)
 */
export async function scheduleNotification(
  title: string,
  body: string,
  delay: number = 0
): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  if (delay > 0) {
    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/assets/aurzo-logo.png',
        badge: '/assets/aurzo-logo.png'
      });
    }, delay);
  } else {
    new Notification(title, {
      body,
      icon: '/assets/aurzo-logo.png',
      badge: '/assets/aurzo-logo.png'
    });
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

