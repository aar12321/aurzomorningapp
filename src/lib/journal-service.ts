/**
 * Journal Service
 * Manages journal entries (daily, gratitude, goal, mood)
 */

import { supabase } from '@/integrations/supabase/client';

export type JournalEntryType = 'daily' | 'gratitude' | 'goal' | 'mood';

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_type: JournalEntryType;
  content: string;
  mood_score?: number; // 1-10
  gratitude_items?: string[];
  goal_reflection?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get journal entries
 */
export async function getJournalEntries(
  userId: string,
  entryType?: JournalEntryType,
  limit: number = 30
): Promise<JournalEntry[]> {
  try {
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entryType) {
      query = query.eq('entry_type', entryType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
}

/**
 * Get today's journal entry
 */
export async function getTodaysJournalEntry(
  userId: string,
  entryType: JournalEntryType
): Promise<JournalEntry | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_type', entryType)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .maybeSingle();

    if (error) {
      // If table doesn't exist, return null (table will be created by migration)
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('Journal entries table not found. Please run the database migration.');
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching today\'s journal entry:', error);
    return null;
  }
}

/**
 * Create or update journal entry
 */
export async function saveJournalEntry(
  userId: string,
  entryType: JournalEntryType,
  content: string,
  options?: {
    mood_score?: number;
    gratitude_items?: string[];
    goal_reflection?: string;
  }
): Promise<JournalEntry | null> {
  try {
    // Check if entry exists for today
    const existing = await getTodaysJournalEntry(userId, entryType);

    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from('journal_entries')
        .update({
          content,
          mood_score: options?.mood_score,
          gratitude_items: options?.gratitude_items as any,
          goal_reflection: options?.goal_reflection,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          entry_type: entryType,
          content,
          mood_score: options?.mood_score,
          gratitude_items: options?.gratitude_items as any,
          goal_reflection: options?.goal_reflection
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving journal entry:', error);
    return null;
  }
}

/**
 * Delete journal entry
 */
export async function deleteJournalEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    return !error;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return false;
  }
}

/**
 * Get mood history
 */
export async function getMoodHistory(userId: string, days: number = 30): Promise<{ date: string; mood: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('created_at, mood_score')
      .eq('user_id', userId)
      .eq('entry_type', 'mood')
      .not('mood_score', 'is', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(entry => ({
      date: entry.created_at,
      mood: entry.mood_score!
    }));
  } catch (error) {
    console.error('Error fetching mood history:', error);
    return [];
  }
}

