import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configured from environment variables
 * Never hardcode secrets here. Uses:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep message generic to avoid leaking env details
  // eslint-disable-next-line no-console
  console.warn('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.');
}

// PUBLIC_INTERFACE
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
