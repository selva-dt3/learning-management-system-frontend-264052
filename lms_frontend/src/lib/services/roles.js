import { supabase } from '../supabaseClient';

/**
 * Role service: centralizes fetching and resolving user roles.
 * Reads from public.user_roles (RLS protected) to get roles for the current user.
 * Falls back gracefully to 'learner' if no roles or on errors.
 */

// Helper to normalize role values
function normalizeRole(role) {
  if (typeof role !== 'string') return null;
  const r = role.toLowerCase();
  return ['admin', 'hr', 'learner'].includes(r) ? r : null;
}

// PUBLIC_INTERFACE
export async function fetchUserRole(userId) {
  /**
   * Fetches the user's primary role.
   * Priority: admin > hr > learner (default).
   * Uses public.user_roles with RLS; expects rows like { user_id, role }.
   */
  const DEFAULT_ROLE = 'learner';
  if (!userId) return DEFAULT_ROLE;

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      // Avoid logging sensitive info
      // eslint-disable-next-line no-console
      console.warn('user_roles read failed');
      return DEFAULT_ROLE;
    }

    const roles = Array.isArray(data) ? data.map(r => normalizeRole(r.role)).filter(Boolean) : [];
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('hr')) return 'hr';
    return DEFAULT_ROLE;
  } catch (_e) {
    return DEFAULT_ROLE;
  }
}

// PUBLIC_INTERFACE
export async function fetchUserRoles(userId) {
  /**
   * Returns an array of roles for the given user from public.user_roles.
   * Gracefully returns [] when unauthenticated or when none found.
   */
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) return [];
    const roles = Array.isArray(data) ? data.map(r => normalizeRole(r.role)).filter(Boolean) : [];
    return Array.from(new Set(roles));
  } catch (_e) {
    return [];
  }
}
