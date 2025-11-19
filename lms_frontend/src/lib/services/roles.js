import { supabase } from '../supabaseClient';

/**
 * Role service: centralizes fetching and resolving user roles.
 * Reads from public.user_roles (RLS protected) to get roles for the current user.
 * Must never throw/reject to avoid infinite loading; always resolve with safe defaults.
 */

// Helper to normalize role values
function normalizeRole(role) {
  if (typeof role !== 'string') return null;
  const r = role.toLowerCase();
  return ['admin', 'hr', 'learner'].includes(r) ? r : null;
}

// Small helper to log when RLS likely blocked visibility
function logRlsVisibilityHint(userId, data, error) {
  // eslint-disable-next-line no-console
  console.debug?.('[roles] query result', { count: Array.isArray(data) ? data.length : null, hasError: !!error, userId });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[roles] RLS or schema error while reading public.user_roles. Returning [] to avoid blocking UI.');
  }
  if (!error && Array.isArray(data) && data.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[roles] No roles found for current user. If access is expected, check RLS/policies on public.user_roles and see README_RLS_TROUBLESHOOTING.md',
    );
  }
}

// PUBLIC_INTERFACE
export async function fetchUserRole(userId) {
  /**
   * Fetches the user's primary role.
   * Priority: admin > hr > learner (default).
   * Uses public.user_roles with RLS; expects rows like { user_id, role }.
   * Returns 'learner' on any error or when unauthenticated.
   */
  const DEFAULT_ROLE = 'learner';
  if (!userId) return DEFAULT_ROLE;

  try {
    // eslint-disable-next-line no-console
    console.debug?.('[roles] fetchUserRole:start', { userId });
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    logRlsVisibilityHint(userId, data, error);

    if (error) {
      // eslint-disable-next-line no-console
      console.debug?.('[roles] fetchUserRole:error returning default role');
      return DEFAULT_ROLE;
    }

    const roles = Array.isArray(data) ? data.map((r) => normalizeRole(r.role)).filter(Boolean) : [];
    // eslint-disable-next-line no-console
    console.debug?.('[roles] fetchUserRole normalized roles:', roles);
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('hr')) return 'hr';
    return DEFAULT_ROLE;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[roles] exception while fetching roles; returning default', e?.message);
    return DEFAULT_ROLE;
  }
}

// PUBLIC_INTERFACE
export async function fetchUserRoles(userId) {
  /**
   * Returns an array of roles for the given user from public.user_roles.
   * Gracefully returns [] when unauthenticated or when none found or on RLS error.
   * This function must never throw; it should be safe in finally blocks.
   */
  if (!userId) return [];
  try {
    // eslint-disable-next-line no-console
    console.debug?.('[roles] fetchUserRoles:start', { userId });
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    logRlsVisibilityHint(userId, data, error);

    if (error) {
      return [];
    }

    const roles = Array.isArray(data) ? data.map((r) => normalizeRole(r.role)).filter(Boolean) : [];
    const unique = Array.from(new Set(roles));
    // eslint-disable-next-line no-console
    console.debug?.('[roles] fetchUserRoles result:', unique);
    return unique;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[roles] exception while listing roles; returning []', e?.message);
    return [];
  }
}
