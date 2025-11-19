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

// Small helper to log when RLS likely blocked visibility
function logRlsVisibilityHint(userId, data, error) {
  // eslint-disable-next-line no-console
  console.debug?.('[roles] query result', { count: Array.isArray(data) ? data.length : null, hasError: !!error });
  if (!error && Array.isArray(data) && data.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[roles] No roles returned. If you expect roles, check RLS/policies on public.user_roles to ensure user_id is visible to the authenticated user.',
    );
    // Provide action hint without leaking secrets
    // eslint-disable-next-line no-console
    console.warn(
      '[roles] For local dev, ensure a row exists in public.user_roles with this user_id and role (admin/hr), and that policy allows authenticated users to select their own rows.',
    );
  }
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
      console.warn('[roles] user_roles read failed (RLS/policy or schema issue possible)');
      return DEFAULT_ROLE;
    }

    logRlsVisibilityHint(userId, data, error);

    const roles = Array.isArray(data) ? data.map((r) => normalizeRole(r.role)).filter(Boolean) : [];
    // eslint-disable-next-line no-console
    console.debug?.('[roles] fetchUserRole normalized roles:', roles);
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('hr')) return 'hr';
    return DEFAULT_ROLE;
  } catch (_e) {
    // eslint-disable-next-line no-console
    console.warn('[roles] exception while fetching roles');
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

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[roles] user_roles list failed');
      return [];
    }

    logRlsVisibilityHint(userId, data, error);

    const roles = Array.isArray(data) ? data.map((r) => normalizeRole(r.role)).filter(Boolean) : [];
    const unique = Array.from(new Set(roles));
    // eslint-disable-next-line no-console
    console.debug?.('[roles] fetchUserRoles result:', unique);
    return unique;
  } catch (_e) {
    // eslint-disable-next-line no-console
    console.warn('[roles] exception while listing roles');
    return [];
  }
}
