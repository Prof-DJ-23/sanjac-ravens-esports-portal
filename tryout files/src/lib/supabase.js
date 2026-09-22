import { createClient } from '@supabase/supabase-js';

/*
|--------------------------------------------------------------------------
| Supabase Client
|--------------------------------------------------------------------------
|
| The Supabase project URL is public/browser-safe.
| The publishable key still comes from GitHub Actions.
|
|--------------------------------------------------------------------------
*/

const supabaseUrl = 'https://rrqsaoegsscwylumjxca.supabase.co';

const supabaseKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseKey.startsWith('sb_publishable_')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function describeError(error) {
  return (
    error?.message ||
    error?.error_description ||
    'Something went wrong. Please try again.'
  );
}
