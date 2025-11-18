import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Navigate, useLocation } from 'react-router-dom';

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

const AuthContext = createContext({ user: null, session: null, loading: true });

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Provides user/session state from Supabase and reacts to auth state changes.
   */
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const current = await getSession();
      setSession(current);
      setUser(current?.user ?? null);
    } catch (e) {
      // avoid leaking sensitive data
      // eslint-disable-next-line no-console
      console.warn('Auth session fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });
    return () => {
      sub.subscription?.unsubscribe?.();
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user, session, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  /**
   * Hook that returns { user, session, loading, refreshSession }
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
