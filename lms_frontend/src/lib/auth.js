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
  signInWithEmailPassword: async () => {},
  signUpWithEmailPassword: async () => {},
  signOut: async () => {},
  refreshSession: async () => {}
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Provides user/session state from Supabase, resolves role(s), and reacts to auth changes.
   */
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('learner');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate?.() || (() => {});

  const refreshSession = useCallback(async () => {
    try {
      const current = await getSession();
      setSession(current);
      const currentUser = current?.user ?? null;
      setUser(currentUser);
      const [r, arr] = await Promise.all([
        fetchUserRole(currentUser?.id),
        fetchUserRoles(currentUser?.id)
      ]);
      setRole(r);
      setRoles(arr);
    } catch (_e) {
      // avoid leaking sensitive data
      // eslint-disable-next-line no-console
      console.warn('Auth session fetch failed');
      setRole('learner');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      const [r, arr] = await Promise.all([
        fetchUserRole(newUser?.id),
        fetchUserRoles(newUser?.id)
      ]);
      setRole(r);
      setRoles(arr);
      setLoading(false);

      // Post-login redirect by role
      if (event === 'SIGNED_IN') {
        if (r === 'admin') navigate('/admin', { replace: true });
        else if (r === 'hr') navigate('/hr', { replace: true });
        else navigate('/', { replace: true });
      }
      if (event === 'SIGNED_OUT') {
        navigate('/', { replace: true });
      }
    });
    return () => {
      sub.subscription?.unsubscribe?.();
    };
  }, [refreshSession, navigate]);

  const ctx = {
    user,
    session,
    role,
    roles,
    loading,
    refreshSession,
    // Context methods for UI consumption
    signInWithEmailPassword: signInWithEmail,
    signUpWithEmailPassword: signUpWithEmail,
    signOut
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
   */
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
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
