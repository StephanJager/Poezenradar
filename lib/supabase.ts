import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export const supabase = hasSupabaseConfig()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null;
