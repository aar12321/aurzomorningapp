/**
 * Meditation Service
 * Manages meditation sessions and library
 */

import { supabase } from '@/integrations/supabase/client';

export type MeditationType = 'guided' | 'breathing' | 'mindfulness';

export interface MeditationSession {
  id: string;
  user_id: string;
  meditation_type: MeditationType;
  duration_minutes: number;
  completed_at: string;
  notes?: string;
}

export interface MeditationLibraryItem {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  audio_url?: string;
  meditation_type: MeditationType;
  category?: string;
  created_at: string;
}

/**
 * Get meditation library
 */
export async function getMeditationLibrary(
  type?: MeditationType,
  category?: string
): Promise<MeditationLibraryItem[]> {
  try {
    let query = supabase
      .from('meditation_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('meditation_type', type);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching meditation library:', error);
    return [];
  }
}

/**
 * Record meditation session
 */
export async function recordMeditationSession(
  userId: string,
  meditationType: MeditationType,
  durationMinutes: number,
  notes?: string
): Promise<MeditationSession | null> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: userId,
        meditation_type: meditationType,
        duration_minutes: durationMinutes,
        notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording meditation session:', error);
    return null;
  }
}

/**
 * Get user's meditation history
 */
export async function getMeditationHistory(
  userId: string,
  limit: number = 30
): Promise<MeditationSession[]> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching meditation history:', error);
    return [];
  }
}

/**
 * Get meditation streak
 */
export async function getMeditationStreak(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('completed_at', dayStart.toISOString())
        .lt('completed_at', dayEnd.toISOString())
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If checking today and no session, that's okay (might not have done it yet)
        // But if checking past days, break the streak
        if (checkDate.getTime() < today.getTime()) {
          break;
        } else {
          // Today hasn't been completed yet, check yesterday
          checkDate.setDate(checkDate.getDate() - 1);
          if (checkDate.getTime() < today.getTime() - 86400000) {
            break; // No session yesterday either
          }
        }
      }

      // Prevent infinite loop
      if (streak > 365) break;
    }

    return streak;
  } catch (error) {
    console.error('Error calculating meditation streak:', error);
    return 0;
  }
}

/**
 * Get total meditation minutes
 */
export async function getTotalMeditationMinutes(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('duration_minutes')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
  } catch (error) {
    console.error('Error calculating total meditation minutes:', error);
    return 0;
  }
}

