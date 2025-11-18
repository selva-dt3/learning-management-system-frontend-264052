import { supabase } from '../supabaseClient';

/**
 * Role service: centralizes fetching and resolving user roles.
 * It first tries profiles table, falling back to user metadata if needed.
 * Never stores secrets; uses initialized Supabase client.
 */

// PUBLIC_INTERFACE
export async function fetchUserRole(userId) {
  /**
   * Fetches the user's role from the 'profiles' table or from user metadata.
   * Returns one of: 'admin' | 'hr' | 'learner'
   * Falls back to 'learner' for missing/invalid roles.
   */
  const DEFAULT_ROLE = 'learner';
  if (!userId) return DEFAULT_ROLE;

  try {
    // Attempt to read from profiles table where id = auth user id
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      // Silently fall back to metadata below
      // eslint-disable-next-line no-console
      console.warn('profiles role fetch failed (falling back to metadata)');
    } else if (data && typeof data.role === 'string') {
      const role = data.role.toLowerCase();
      if (role === 'admin' || role === 'hr' || role === 'learner') {
        return role;
      }
    }
  } catch (_e) {
    // ignore and fall back
  }

  // Fallback: read from auth user metadata if available
  try {
    const { data: { user } = {} } = await supabase.auth.getUser();
    const metaRole = user?.user_metadata?.role;
    if (typeof metaRole === 'string') {
      const role = metaRole.toLowerCase();
      if (role === 'admin' || role === 'hr' || role === 'learner') {
        return role;
      }
    }
  } catch (_e) {
    // ignore
  }

  return DEFAULT_ROLE;
}
