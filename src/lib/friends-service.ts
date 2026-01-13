/**
 * Friends Service
 * Manages friend relationships and friend leaderboards
 */

import { supabase } from '@/integrations/supabase/client';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  friend?: {
    id: string;
    full_name: string;
    email: string;
    total_xp: number;
    streak_count: number;
  };
}

export interface FriendRequest {
  id: string;
  from_user: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_xp: number;
  streak_count: number;
  rank_position: number;
  is_current_user: boolean;
}

export interface PersonalRecord {
  id: string;
  record_type: string;
  value: number;
  achieved_at: string;
  metadata?: any;
}

/**
 * Get current user's friends (accepted)
 */
export async function getFriends(userId: string): Promise<Friend[]> {
  try {
    // Get friendships where user is either user_id or friend_id
    const { data: sentFriends, error: sentError } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        friend:users!friends_friend_id_fkey(id, full_name, email, total_xp, streak_count)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    const { data: receivedFriends, error: receivedError } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        friend:users!friends_user_id_fkey(id, full_name, email, total_xp, streak_count)
      `)
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (sentError || receivedError) {
      console.error('Error fetching friends:', sentError || receivedError);
      return [];
    }

    const allFriends = [
      ...(sentFriends || []),
      ...(receivedFriends || [])
    ];

    return allFriends as unknown as Friend[];
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        created_at,
        from_user:users!friends_user_id_fkey(id, full_name, email)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    return (data || []).map(req => ({
      id: req.id,
      from_user: req.from_user as any,
      created_at: req.created_at
    }));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(userId: string, friendEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by email
    const { data: friendData, error: findError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', friendEmail.toLowerCase())
      .maybeSingle();

    if (findError || !friendData) {
      return { success: false, message: 'User not found with that email' };
    }

    if (friendData.id === userId) {
      return { success: false, message: "You can't add yourself as a friend" };
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friends')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendData.id}),and(user_id.eq.${friendData.id},friend_id.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, message: 'You are already friends' };
      }
      if (existing.status === 'pending') {
        return { success: false, message: 'Friend request already pending' };
      }
    }

    // Send request
    const { error: insertError } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendData.id,
        status: 'pending'
      });

    if (insertError) throw insertError;

    return { success: true, message: `Friend request sent to ${friendData.full_name}` };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, message: 'Failed to send friend request' };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friends')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    return !error;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friends')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    return !error;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    return !error;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
}

/**
 * Get friends leaderboard
 */
export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  try {
    // Get all friends
    const friends = await getFriends(userId);
    const friendIds = friends.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    );

    // Include current user
    const allUserIds = [userId, ...friendIds];

    // Get user data for all
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, total_xp, streak_count')
      .in('id', allUserIds)
      .order('total_xp', { ascending: false });

    if (error) throw error;

    return (data || []).map((user, index) => ({
      user_id: user.id,
      full_name: user.full_name || 'Unknown',
      total_xp: user.total_xp || 0,
      streak_count: user.streak_count || 0,
      rank_position: index + 1,
      is_current_user: user.id === userId
    }));
  } catch (error) {
    console.error('Error getting friends leaderboard:', error);
    return [];
  }
}

/**
 * Get global leaderboard
 */
export async function getGlobalLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data: userData } = session ? await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single() : { data: null };

    const currentUserId = userData?.id;

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, total_xp, streak_count')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((user, index) => ({
      user_id: user.id,
      full_name: user.full_name || 'Unknown',
      total_xp: user.total_xp || 0,
      streak_count: user.streak_count || 0,
      rank_position: index + 1,
      is_current_user: user.id === currentUserId
    }));
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    return [];
  }
}

/**
 * Get user's personal records
 */
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting personal records:', error);
    return [];
  }
}

/**
 * Update or create a personal record
 */
export async function updatePersonalRecord(
  userId: string,
  recordType: string,
  value: number,
  metadata?: any
): Promise<boolean> {
  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('personal_records')
      .select('id, value')
      .eq('user_id', userId)
      .eq('record_type', recordType)
      .maybeSingle();

    if (existing) {
      // Only update if new value is better
      if (value > existing.value) {
        const { error } = await supabase
          .from('personal_records')
          .update({
            value,
            achieved_at: new Date().toISOString(),
            metadata
          })
          .eq('id', existing.id);

        return !error;
      }
      return false; // Not a new record
    } else {
      // Create new record
      const { error } = await supabase
        .from('personal_records')
        .insert({
          user_id: userId,
          record_type: recordType,
          value,
          metadata
        });

      return !error;
    }
  } catch (error) {
    console.error('Error updating personal record:', error);
    return false;
  }
}

/**
 * Get friend count
 */
export async function getFriendCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting friend count:', error);
    return 0;
  }
}

