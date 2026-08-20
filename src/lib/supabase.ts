import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const configuredSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const hasValidSupabaseConfig =
  /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(configuredSupabaseUrl) &&
  Boolean(configuredSupabaseAnonKey) &&
  !configuredSupabaseUrl.includes('PASTE_MY_') &&
  !configuredSupabaseAnonKey.includes('PASTE_MY_');

// Keep the shell renderable before local Supabase credentials are added.
const supabaseUrl = hasValidSupabaseConfig
  ? configuredSupabaseUrl
  : 'https://placeholder.supabase.co';
const supabaseAnonKey = hasValidSupabaseConfig
  ? configuredSupabaseAnonKey
  : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createIsolatedSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
