import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AurzoSubscription {
  id: string;
  user_id: string;
  plan_type: 'premium' | 'individual' | 'none';
  platforms: string[];
  status: 'active' | 'cancelled' | 'paused';
  price_monthly: number;
  next_billing_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AurzoUserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  goals: string[];
  interests: string[];
  referral_source: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export const PLATFORMS = [
  {
    id: 'morning-growth-loop',
    name: 'Morning Growth Loop',
    tagline: 'Learn something new every day',
    description: 'Daily quizzes, streaks, XP & personalized learning paths',
    emoji: '🌅',
    colorFrom: '#f97316',
    colorTo: '#f59e0b',
    internalUrl: '/legacy/overview',
    features: ['Daily quizzes', 'Streak tracking', 'XP & badges', 'Leaderboards'],
  },
  {
    id: 'aurzo-finance',
    name: 'Aurzo Finance',
    tagline: 'Master your money',
    description: 'Budgeting, investment tracking & financial literacy tools',
    emoji: '💰',
    colorFrom: '#22c55e',
    colorTo: '#10b981',
    internalUrl: null,
    externalUrl: '#', // placeholder - update when finance app is live
    features: ['Budget planner', 'Investment tracker', 'Financial quizzes', 'Goal setting'],
  },
  {
    id: 'aurzo-morning',
    name: 'AurzoMorning',
    tagline: 'Your AI-powered day',
    description: 'AI tools for every meeting, task & decision on your calendar',
    emoji: '⚡',
    colorFrom: '#3b82f6',
    colorTo: '#8b5cf6',
    internalUrl: '/app',
    features: ['Calendar integration', 'AI meeting prep', '25+ smart tools', 'Monday drops'],
  },
  {
    id: 'aurzo-wellness',
    name: 'Aurzo Wellness',
    tagline: 'Feel your best every day',
    description: 'Habit tracking, workout planning & daily wellness insights',
    emoji: '🌿',
    colorFrom: '#14b8a6',
    colorTo: '#06b6d4',
    internalUrl: null,
    externalUrl: '#', // placeholder - update when wellness app is live
    features: ['Habit tracker', 'Workout planner', 'Sleep tracking', 'Mood journal'],
  },
] as const;

export type PlatformId = typeof PLATFORMS[number]['id'];

const INDIVIDUAL_PRICE = 5;
const PREMIUM_PRICE = 15;

export { INDIVIDUAL_PRICE, PREMIUM_PRICE };

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AurzoSubscription | null>(null);
  const [profile, setProfile] = useState<AurzoUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [subRes, profileRes] = await Promise.all([
        supabase
          .from('aurzo_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('aurzo_user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      setSubscription(subRes.data as AurzoSubscription | null);
      setProfile(profileRes.data as AurzoUserProfile | null);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived helpers
  const isPremium =
    subscription?.plan_type === 'premium' && subscription?.status === 'active';

  const hasAccess = (platformId: string): boolean => {
    if (!subscription || subscription.status !== 'active') return false;
    if (subscription.plan_type === 'premium') return true;
    return subscription.platforms.includes(platformId);
  };

  const hasAnyAccess = !!subscription && subscription.status === 'active';

  return {
    subscription,
    profile,
    loading,
    isPremium,
    hasAccess,
    hasAnyAccess,
    refresh: fetchData,
  };
}
