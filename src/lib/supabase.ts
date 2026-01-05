// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;

  // Only run in browser
  if (typeof window === 'undefined') {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ❌ DO NOT throw
  if (!url || !key) {
    console.warn('Supabase client not initialized: missing public env vars');
    return null;
  }

  client = createClient(url, key);
  return client;
}
