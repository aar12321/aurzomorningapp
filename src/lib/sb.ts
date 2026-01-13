// src/lib/sb.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to hardcoded values if env vars are missing (for custom domain deployments)
const FALLBACK_SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const FALLBACK_SUPABASE_KEY = 'REMOVED';

const finalUrl = SUPABASE_URL || FALLBACK_SUPABASE_URL;
const finalKey = SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_KEY;

if (!finalUrl || !finalKey) {
  console.error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  // Don't throw - create a client anyway to prevent white screen
}

// IMPORTANT: this file must NOT import anything from your app (pages/components/barrels).
export const sb: SupabaseClient = createClient(finalUrl, finalKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Keep sessions alive for as long as possible
    // Note: JWT expiry is also set in Supabase dashboard (default is 1 hour, can be extended)
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
