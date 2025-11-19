import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { fetchUserRole, fetchUserRoles } from './services/roles';
import Loading from '../components/Loading';
import AccessDenied from '../components/AccessDenied';

/**
 * PUBLIC_INTERFACE
 * signInWithEmail
 * Simple email/password sign in using Supabase
 */
export async function signInWithEmail(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid credentials');
  }
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('Email and password are required');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password: trimmedPassword });
  if (error) {
    throw new Error(error.message || 'Unable to sign in');
  }
  return data?.session ?? null;
}

/**
 * PUBLIC_INTERFACE
 * signUpWithEmail
 * Sign up with email/password. Uses emailRedirectTo if SITE_URL is configured by deployment.
 */
export async function signUpWithEmail(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid input');
  }
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('Email and password are required');
  }
  const options = {};
  // If deployment maps SITE_URL to REACT_APP_FRONTEND_URL, you can set email redirect here.
  if (process.env.REACT_APP_FRONTEND_URL) {
    options.emailRedirectTo = process.env.REACT_APP_FRONTEND_URL;
  }
  const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password: trimmedPassword, options });
  if (error) {
    throw new Error(error.message || 'Unable to sign up');
  }
  return data?.user ?? null;
}

/**
 * PUBLIC_INTERFACE
 * signOut
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || 'Unable to sign out');
  }
}

/**
 * PUBLIC_INTERFACE
 * getSession
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || 'Unable to fetch session');
  }
  return data?.session ?? null;
}

/**
 * PUBLIC_INTERFACE
 * getUserRole
 */
export async function getUserRole() {
  /**
   * Returns the current authenticated user's role string.
   * Falls back to 'learner' when unauthenticated or no role found.
   */
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  return fetchUserRole(userId);
}

const AuthContext = createContext({
  user: null,
  session: null,
  role: 'learner',
  roles: [],
  loading: true,
  rolesLoading: true,
  signInWithEmailPassword: async () => {},
  signUpWithEmailPassword: async () => {},
  signOut: async () => {},
  refreshSession: async () => {}
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Provides user/session state from Supabase, resolves role(s), and reacts to auth changes.
   *
   * Important: Navigation is guarded to only run when Router context exists.
   */
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('learner');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);       // session/user loading
  const [rolesLoading, setRolesLoading] = useState(true); // roles loading to avoid race conditions

  // Always call useNavigate to satisfy hooks rules; Router presence is ensured by AppRouter.
  const navigate = useNavigate();

  // Wrapper to centralize navigation calls
  const safeNavigate = useCallback((to, options) => {
    try {
      navigate(to, options);
    } catch (_e) {
      // swallow during tests if Router not present
    }
  }, [navigate]);

  const resolveRoles = useCallback(async (uid) => {
    try {
      if (!uid) {
        setRole('learner');
        setRoles([]);
        return { role: 'learner', roles: [] };
      }
      const [r, arr] = await Promise.all([
        fetchUserRole(uid),
        fetchUserRoles(uid)
      ]);
      setRole(r);
      setRoles(arr);
      return { role: r, roles: arr };
    } catch (_e) {
      // eslint-disable-next-line no-console
      console.warn('Roles fetch failed');
      setRole('learner');
      setRoles([]);
      return { role: 'learner', roles: [] };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.debug?.('[Auth] refreshSession:start');
    setLoading(true);
    setRolesLoading(true);
    try {
      const current = await getSession();
      setSession(current);
      const currentUser = current?.user ?? null;
      setUser(currentUser);
      const resolved = await resolveRoles(currentUser?.id);
      // eslint-disable-next-line no-console
      console.debug?.('[Auth] refreshSession:roles', resolved);
    } catch (_e) {
      // avoid leaking sensitive data
      // eslint-disable-next-line no-console
      console.warn('[Auth] session fetch failed');
      setRole('learner');
      setRoles([]);
    } finally {
      setLoading(false);
      setRolesLoading(false);
      // eslint-disable-next-line no-console
      console.debug?.('[Auth] refreshSession:done');
    }
  }, [resolveRoles]);

  useEffect(() => {
    refreshSession();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // eslint-disable-next-line no-console
      console.debug?.('[Auth] onAuthStateChange', event);
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      setRolesLoading(true);
      const resolved = await resolveRoles(newUser?.id);
      setRolesLoading(false);

      // Post-login redirect by role AFTER roles loaded
      if (event === 'SIGNED_IN') {
        if (resolved.role === 'admin') safeNavigate('/admin', { replace: true });
        else if (resolved.role === 'hr') safeNavigate('/hr', { replace: true });
        else safeNavigate('/', { replace: true });
      }
      if (event === 'SIGNED_OUT') {
        safeNavigate('/', { replace: true });
      }
    });
    return () => {
      sub.subscription?.unsubscribe?.();
    };
  }, [refreshSession, resolveRoles, safeNavigate]);

  // Context-managed signOut to clear local state immediately and navigate safely
  const ctxSignOut = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.debug?.('[Auth] signOut:begin');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (_e) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] signOut:error');
      throw _e;
    } finally {
      // Clear local auth/roles to ensure guards react instantly
      setSession(null);
      setUser(null);
      setRole('learner');
      setRoles([]);
      setLoading(false);
      setRolesLoading(false);
      safeNavigate('/', { replace: true });
      // eslint-disable-next-line no-console
      console.debug?.('[Auth] signOut:done');
    }
  }, [safeNavigate]);

  const ctx = {
    user,
    session,
    role,
    roles,
    loading,
    rolesLoading,
    refreshSession,
    // Context methods for UI consumption
    signInWithEmailPassword: signInWithEmail,
    signUpWithEmailPassword: signUpWithEmail,
    signOut: ctxSignOut
  };

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  /**
   * Hook that returns auth state and helpers.
   */
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function ProtectedRoute({ children }) {
  /**
   * Simple protected route wrapper: redirects to /auth/login when unauthenticated.
   */
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!session) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}

// PUBLIC_INTERFACE
export function RoleProtectedRoute({ children, allowedRoles = [] }) {
  /**
   * Role-based protected route wrapper: ensures user has one of allowedRoles.
   * Unauthenticated users are redirected to /auth/login.
   * Authenticated but unauthorized users see a friendly 403 message.
   * Waits for roles to finish loading to avoid race condition.
   */
  const { session, role, loading, rolesLoading } = useAuth();
  const location = useLocation();

  if (loading || rolesLoading) {
    return <Loading label="Checking permissions..." />;
  }

  if (!session) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(role);
  if (!hasAccess) {
    return <AccessDenied />;
  }

  return children;
}
