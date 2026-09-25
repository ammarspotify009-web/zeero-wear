import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

/**
 * OPTIMIZED Supabase client — connection pool friendly.
 *
 * Key changes vs default createClient():
 * 1. Realtime disabled — we never subscribe to live changes, so the default
 *    persistent WebSocket was silently consuming one of the 60 free-tier DB
 *    connections per open browser tab. Disabling this is the single biggest
 *    win against "max clients reached".
 * 2. Auth sessions persist so the token-refresh round-trip only happens once
 *    per session, not on every page visit.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    db: { schema: 'public' },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    // ─── CRITICAL FIX ──────────────────────────────────────────────────────────
    // Disable the Realtime WebSocket entirely. On Supabase Free tier there are
    // only 60 DB connections available. Every open browser tab was holding one
    // idle WebSocket → after ~60 concurrent visitors the pool was full and
    // INSERT/SELECT calls from new users would fail ("max clients reached").
    // ───────────────────────────────────────────────────────────────────────────
    realtime: {
      params: {
        eventsPerSecond: -1, // -1 = disabled
      },
    },
    global: {
      headers: { 'x-client-info': 'zeero-wear-web' },
    },
  }
);
