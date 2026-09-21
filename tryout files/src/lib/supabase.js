import { createClient } from '@supabase/supabase-js';

// Browser-safe Supabase connection values.
// Never place a service_role or secret key in this frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured
  ? createClient(url, key)
  : null;

export function describeError(error) {
  return error?.message || error?.error_description || 'Something went wrong.';
}
