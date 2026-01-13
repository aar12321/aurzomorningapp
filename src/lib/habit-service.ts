/**
 * Habit Service
 * Manages user habits and habit tracking
 */

import { supabase } from '@/integrations/supabase/client';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  target_frequency: 'daily' | 'weekly' | 'custom';
  reminder_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  notes?: string;
}

export interface HabitStats {
  habit: Habit;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  total_completions: number;
  last_completed?: string;
}

/**
 * Get user's habits
 */
export async function getUserHabits(userId: string, activeOnly: boolean = false): Promise<Habit[]> {
  try {
    let query = supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching habits:', error);
    return [];
  }
}

/**
 * Create a new habit
 */
export async function createHabit(
  userId: string,
  name: string,
  description?: string,
  icon?: string,
  color?: string,
  targetFrequency: 'daily' | 'weekly' | 'custom' = 'daily',
  reminderTime?: string
): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name,
        description,
        icon,
        color,
        target_frequency: targetFrequency,
        reminder_time: reminderTime,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating habit:', error);
      // Check if it's a table not found error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        throw new Error('Habits table not found. Please run the database migration first.');
      }
      throw error;
    }
    return data;
  } catch (error: any) {
    console.error('Error creating habit:', error);
    throw error; // Re-throw so caller can handle it
  }
}

/**
 * Update a habit
 */
export async function updateHabit(
  habitId: string,
  updates: Partial<Pick<Habit, 'name' | 'description' | 'icon' | 'color' | 'target_frequency' | 'reminder_time' | 'is_active'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', habitId);

    return !error;
  } catch (error) {
    console.error('Error updating habit:', error);
    return false;
  }
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    return !error;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
}

/**
 * Complete a habit
 */
export async function completeHabit(habitId: string, notes?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        notes
      });

    return !error;
  } catch (error) {
    console.error('Error completing habit:', error);
    return false;
  }
}

/**
 * Get habit completions
 */
export async function getHabitCompletions(
  habitId: string,
  startDate?: Date,
  endDate?: Date
): Promise<HabitCompletion[]> {
  try {
    let query = supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false });

    if (startDate) {
      query = query.gte('completed_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('completed_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching habit completions:', error);
    return [];
  }
}

/**
 * Get habit statistics
 */
export async function getHabitStats(habitId: string): Promise<HabitStats | null> {
  try {
    // Get habit
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();

    if (habitError || !habit) return null;

    // Get all completions
    const completions = await getHabitCompletions(habitId);
    
    // Calculate stats
    const totalCompletions = completions.length;
    const lastCompleted = completions[0]?.completed_at;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < completions.length; i++) {
      const completionDate = new Date(completions[i].completed_at);
      completionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedCompletions = [...completions].sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    for (let i = 1; i < sortedCompletions.length; i++) {
      const prevDate = new Date(sortedCompletions[i - 1].completed_at);
      const currDate = new Date(sortedCompletions[i].completed_at);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = completions.filter(c => 
      new Date(c.completed_at) >= thirtyDaysAgo
    );
    const completionRate = (recentCompletions.length / 30) * 100;

    return {
      habit,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      completion_rate: Math.round(completionRate),
      total_completions: totalCompletions,
      last_completed: lastCompleted
    };
  } catch (error) {
    console.error('Error calculating habit stats:', error);
    return null;
  }
}

/**
 * Check if habit was completed today
 */
export async function isHabitCompletedToday(habitId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString())
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking habit completion:', error);
    return false;
  }
}

