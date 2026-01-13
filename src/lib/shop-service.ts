/**
 * Reward Shop Service
 * Manages shop items and purchases
 */

import { supabase } from '@/integrations/supabase/client';

export type ShopItemType = 'theme' | 'avatar' | 'powerup' | 'badge' | 'content';

export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  item_type: ShopItemType;
  xp_cost: number;
  image_url?: string;
  is_limited: boolean;
  available_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
  xp_spent: number;
  item?: ShopItem;
}

/**
 * Get available shop items
 */
export async function getShopItems(
  itemType?: ShopItemType,
  includeLimited: boolean = true
): Promise<ShopItem[]> {
  try {
    let query = supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('xp_cost', { ascending: true });

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    if (!includeLimited) {
      query = query.eq('is_limited', false);
    } else {
      // Include limited items that are still available
      const now = new Date().toISOString();
      query = query.or(`is_limited.eq.false,available_until.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }
}

/**
 * Purchase an item
 */
export async function purchaseItem(
  userId: string,
  itemId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get item
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .eq('is_active', true)
      .single();

    if (itemError || !item) {
      return { success: false, message: 'Item not found' };
    }

    // Check if limited item is still available
    if (item.is_limited && item.available_until) {
      if (new Date(item.available_until) < new Date()) {
        return { success: false, message: 'This item is no longer available' };
      }
    }

    // Check if user already owns this item
    const { data: existingPurchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (existingPurchase) {
      return { success: false, message: 'You already own this item' };
    }

    // Get user's XP
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, message: 'User not found' };
    }

    if ((user.total_xp || 0) < item.xp_cost) {
      return { success: false, message: 'Not enough XP' };
    }

    // Deduct XP and record purchase
    const { error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: userId,
        item_id: itemId,
        xp_spent: item.xp_cost
      });

    if (purchaseError) throw purchaseError;

    // Update user XP
    const { error: xpError } = await supabase
      .from('users')
      .update({ total_xp: (user.total_xp || 0) - item.xp_cost })
      .eq('id', userId);

    if (xpError) throw xpError;

    return { success: true, message: 'Purchase successful!' };
  } catch (error) {
    console.error('Error purchasing item:', error);
    return { success: false, message: 'Purchase failed' };
  }
}

/**
 * Get user's purchases
 */
export async function getUserPurchases(userId: string): Promise<UserPurchase[]> {
  try {
    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        item:shop_items(*)
      `)
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      item: p.item as any
    }));
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return [];
  }
}

/**
 * Check if user owns an item
 */
export async function userOwnsItem(userId: string, itemId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking item ownership:', error);
    return false;
  }
}

