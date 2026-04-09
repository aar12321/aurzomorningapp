// src/lib/sb.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const finalUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lnvebvrayuveygycpolc.supabase.co';
const finalKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ifskZ-illR5oea_tvMlgLQ_jCVIXmIR';

if (!finalUrl || !finalKey) {
  console.error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
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
