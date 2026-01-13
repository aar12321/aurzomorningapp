import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  theme?: 'sunrise' | 'sunset';
  location?: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  };
  phone_number?: string;
  notification_settings?: {
    notification_method: string[];
    notification_preferences: {
      include_news: boolean;
      include_quotes: boolean;
      include_challenge: boolean;
      news_categories: string[];
    };
  };
  last_dashboard_tab?: string;
  last_news_category?: string;
}

/**
 * Get all user preferences from database
 * Falls back to localStorage if user is not logged in
 */
export async function getUserPreferences(): Promise<Partial<UserPreferences>> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Return preferences from localStorage as fallback
    return {
      theme: (localStorage.getItem('theme') as 'sunrise' | 'sunset') || 'sunrise',
      location: (() => {
        const stored = localStorage.getItem('user_location');
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            return undefined;
          }
        }
        return undefined;
      })(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Sync to localStorage as cache
      if (data.theme) {
        localStorage.setItem('theme', data.theme);
      }
      if (data.location) {
        localStorage.setItem('user_location', JSON.stringify(data.location));
      }

      return {
        theme: data.theme as 'sunrise' | 'sunset' | undefined,
        location: data.location as UserPreferences['location'],
        phone_number: data.phone_number,
        notification_settings: data.notification_settings as UserPreferences['notification_settings'],
        last_dashboard_tab: data.last_dashboard_tab,
        last_news_category: data.last_news_category,
      };
    }

    return {};
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    // Fallback to localStorage
    return {
      theme: (localStorage.getItem('theme') as 'sunrise' | 'sunset') || 'sunrise',
      location: (() => {
        const stored = localStorage.getItem('user_location');
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            return undefined;
          }
        }
        return undefined;
      })(),
    };
  }
}

/**
 * Get a specific preference by key
 */
export async function getPreference<K extends keyof UserPreferences>(
  key: K
): Promise<UserPreferences[K] | undefined> {
  const prefs = await getUserPreferences();
  return prefs[key];
}

/**
 * Save a preference to database (and localStorage as cache)
 */
export async function savePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K] | undefined
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  // Always update localStorage as cache
  if (key === 'theme' && value) {
    localStorage.setItem('theme', value as string);
  } else if (key === 'theme' && !value) {
    localStorage.removeItem('theme');
  } else if (key === 'location' && value) {
    localStorage.setItem('user_location', JSON.stringify(value));
    // Dispatch event for components listening to location updates
    window.dispatchEvent(new Event('locationUpdated'));
  } else if (key === 'location' && !value) {
    localStorage.removeItem('user_location');
    window.dispatchEvent(new Event('locationUpdated'));
  }

  if (!session) {
    // If not logged in, only save to localStorage
    return;
  }

  try {
    // For undefined values, we need to set them to null in the database
    const updateData: any = {
      [key]: value ?? null,
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        ...updateData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  } catch (error) {
    console.error(`Error saving preference ${key}:`, error);
    throw error;
  }
}

/**
 * Save multiple preferences at once
 */
export async function savePreferences(
  preferences: Partial<UserPreferences>
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  // Update localStorage for supported keys
  if (preferences.theme) {
    localStorage.setItem('theme', preferences.theme);
  }
  if (preferences.location) {
    localStorage.setItem('user_location', JSON.stringify(preferences.location));
    window.dispatchEvent(new Event('locationUpdated'));
  }

  if (!session) {
    return;
  }

  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
}

