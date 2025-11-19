import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * supabase
 * Supabase client configured from environment variables.
 * It reads:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 * No secrets are logged; when missing, a generic warning is printed.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep message generic to avoid leaking env details
  // eslint-disable-next-line no-console
  console.warn('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
