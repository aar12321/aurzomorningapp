/**
 * Routine Service
 * Manages user morning routines
 */

import { supabase } from '@/integrations/supabase/client';

export interface RoutineStep {
  id: string;
  type: 'quiz' | 'flashcard' | 'game' | 'journal' | 'meditation' | 'custom';
  name: string;
  duration?: number; // minutes
  config?: Record<string, any>;
}

export interface UserRoutine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  steps: RoutineStep[];
  estimated_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description?: string;
  steps: RoutineStep[];
  category?: string;
  estimated_duration: number;
}

export interface RoutineCompletion {
  id: string;
  user_id: string;
  routine_id: string;
  completed_at: string;
  duration_minutes?: number;
  steps_completed?: any;
}

/**
 * Get user's routines
 */
export async function getUserRoutines(userId: string): Promise<UserRoutine[]> {
  try {
    const { data, error } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      steps: Array.isArray(r.steps) ? r.steps : []
    }));
  } catch (error) {
    console.error('Error fetching routines:', error);
    return [];
  }
}

/**
 * Create a new routine
 */
export async function createRoutine(
  userId: string,
  name: string,
  description: string,
  steps: RoutineStep[]
): Promise<UserRoutine | null> {
  try {
    const estimatedDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);

    const { data, error } = await supabase
      .from('user_routines')
      .insert({
        user_id: userId,
        name,
        description,
        steps: steps as any,
        estimated_duration: estimatedDuration,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, steps: Array.isArray(data.steps) ? data.steps : [] };
  } catch (error) {
    console.error('Error creating routine:', error);
    return null;
  }
}

/**
 * Update a routine
 */
export async function updateRoutine(
  routineId: string,
  updates: Partial<Pick<UserRoutine, 'name' | 'description' | 'steps' | 'is_active'>>
): Promise<boolean> {
  try {
    const updateData: any = { ...updates, updated_at: new Date().toISOString() };
    
    if (updates.steps) {
      updateData.estimated_duration = updates.steps.reduce((sum, step) => sum + (step.duration || 0), 0);
    }

    const { error } = await supabase
      .from('user_routines')
      .update(updateData)
      .eq('id', routineId);

    return !error;
  } catch (error) {
    console.error('Error updating routine:', error);
    return false;
  }
}

/**
 * Delete a routine
 */
export async function deleteRoutine(routineId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_routines')
      .delete()
      .eq('id', routineId);

    return !error;
  } catch (error) {
    console.error('Error deleting routine:', error);
    return false;
  }
}

/**
 * Get routine templates
 */
export async function getRoutineTemplates(): Promise<RoutineTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('routine_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      steps: Array.isArray(t.steps) ? t.steps : []
    }));
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

/**
 * Complete a routine
 */
export async function completeRoutine(
  userId: string,
  routineId: string,
  durationMinutes?: number,
  stepsCompleted?: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('routine_completions')
      .insert({
        user_id: userId,
        routine_id: routineId,
        duration_minutes: durationMinutes,
        steps_completed: stepsCompleted
      });

    return !error;
  } catch (error) {
    console.error('Error completing routine:', error);
    return false;
  }
}

/**
 * Get routine completion history
 */
export async function getRoutineCompletions(
  userId: string,
  routineId?: string
): Promise<RoutineCompletion[]> {
  try {
    let query = supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(30);

    if (routineId) {
      query = query.eq('routine_id', routineId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching completions:', error);
    return [];
  }
}

