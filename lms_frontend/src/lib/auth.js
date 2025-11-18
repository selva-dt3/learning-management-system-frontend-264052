import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchUserRole } from './services/roles';

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

const AuthContext = createContext({ user: null, session: null, role: 'learner', loading: true });

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Provides user/session state from Supabase, resolves role, and reacts to auth changes.
   */
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('learner');
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const current = await getSession();
      setSession(current);
      const currentUser = current?.user ?? null;
      setUser(currentUser);
      const r = await fetchUserRole(currentUser?.id);
      setRole(r);
    } catch (_e) {
      // avoid leaking sensitive data
      // eslint-disable-next-line no-console
      console.warn('Auth session fetch failed');
      setRole('learner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      const r = await fetchUserRole(newUser?.id);
      setRole(r);
      setLoading(false);
    });
    return () => {
      sub.subscription?.unsubscribe?.();
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  /**
   * Hook that returns { user, session, role, loading, refreshSession }
   */
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function ProtectedRoute({ children }) {
  /**
   * Simple protected route wrapper: redirects to /login when unauthenticated.
   */
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// PUBLIC_INTERFACE
export function RoleProtectedRoute({ children, allowedRoles = [] }) {
  /**
   * Role-based protected route wrapper: ensures user has one of allowedRoles.
   * Unauthenticated users are redirected to /login.
   * Authenticated but unauthorized users see a 403-style message.
   */
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(role);
  if (!hasAccess) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="badge" style={{ background: '#fff3f3', borderColor: 'var(--oc-error)', color: '#7f1d1d', marginBottom: 8 }}>403</div>
          <h2 style={{ marginTop: 0 }}>Access denied</h2>
          <p style={{ color: 'var(--oc-muted-text)' }}>
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
