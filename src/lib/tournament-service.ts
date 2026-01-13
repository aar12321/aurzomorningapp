/**
 * Tournament Service
 * Manages weekly/monthly tournaments
 */

import { supabase } from '@/integrations/supabase/client';

export type TournamentType = 'weekly' | 'monthly' | 'special';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournament_type: TournamentType;
  start_date: string;
  end_date: string;
  prize_description?: string;
  is_active: boolean;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  score: number;
  rank?: number;
  joined_at: string;
  user?: {
    id: string;
    full_name: string;
    total_xp: number;
  };
}

/**
 * Get active tournaments
 */
export async function getActiveTournaments(): Promise<Tournament[]> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

/**
 * Get tournament leaderboard
 */
export async function getTournamentLeaderboard(
  tournamentId: string,
  limit: number = 50
): Promise<TournamentParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        user:users(id, full_name, total_xp)
      `)
      .eq('tournament_id', tournamentId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Update ranks
    const participants = (data || []).map((p, index) => ({
      ...p,
      rank: index + 1,
      user: p.user as any
    }));

    return participants;
  } catch (error) {
    console.error('Error fetching tournament leaderboard:', error);
    return [];
  }
}

/**
 * Join a tournament
 */
export async function joinTournament(
  userId: string,
  tournamentId: string
): Promise<boolean> {
  try {
    // Check if already joined
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return true; // Already joined
    }

    const { error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        score: 0
      });

    return !error;
  } catch (error) {
    console.error('Error joining tournament:', error);
    return false;
  }
}

/**
 * Update tournament score
 */
export async function updateTournamentScore(
  userId: string,
  tournamentId: string,
  scoreDelta: number
): Promise<boolean> {
  try {
    // Get current score
    const { data: participant, error: fetchError } = await supabase
      .from('tournament_participants')
      .select('score')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !participant) {
      // Not joined yet, join first
      const joined = await joinTournament(userId, tournamentId);
      if (!joined) return false;
    }

    // Update score
    const { error } = await supabase
      .from('tournament_participants')
      .update({
        score: (participant?.score || 0) + scoreDelta
      })
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error updating tournament score:', error);
    return false;
  }
}

/**
 * Get user's tournament participation
 */
export async function getUserTournaments(userId: string): Promise<TournamentParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        tournament:tournaments(*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      tournament: p.tournament as any
    }));
  } catch (error) {
    console.error('Error fetching user tournaments:', error);
    return [];
  }
}

