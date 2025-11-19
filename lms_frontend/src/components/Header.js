import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, signOut } from '../lib/auth';
import { useToast } from './Toast';

/**
 * PUBLIC_INTERFACE
 * Header component showing session-aware actions:
 * - When unauthenticated: Sign In and Sign Up buttons open minimal inline modals.
 * - When authenticated: show user email and Sign Out.
 * Styling follows Ocean Professional theme variables.
 */
export default function Header() {
  const { user } = useAuth();
  const { notify } = useToast();

  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const onSignOut = async () => {
    try {
      await signOut();
      notify('Signed out', 'success');
    } catch (_e) {
      notify('Unable to sign out', 'error');
    }
  };

  return (
    <>
      <nav className="nav-gradient" style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        borderBottom: '1px solid var(--oc-border)'
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '0.75rem', paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--oc-primary)', boxShadow: 'var(--oc-shadow-sm)'
            }} />
            <span style={{ fontWeight: 800, color: '#0f172a' }}>LMS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!user && (
              <>
                <button className="btn btn-secondary" onClick={() => setShowSignIn(true)}>Sign In</button>
                <button className="btn" onClick={() => setShowSignUp(true)}>Sign Up</button>
              </>
            )}
            {user && (
              <>
                <span className="badge" aria-label="Signed in email" title={user.email}>{user.email}</span>
                <button className="btn btn-secondary" onClick={onSignOut}>Sign Out</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {showSignIn && (
        <Modal onClose={() => setShowSignIn(false)} title="Sign In">
          <AuthForm mode="signin" onDone={() => setShowSignIn(false)} />
        </Modal>
      )}
      {showSignUp && (
        <Modal onClose={() => setShowSignUp(false)} title="Sign Up">
          <AuthForm mode="signup" onDone={() => setShowSignUp(false)} />
        </Modal>
      )}
    </>
  );
}

/**
 * Simple modal primitive using semantic markup and accessible structure.
 */
function Modal({ children, title, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 12
      }}
      onClick={onClose}
    >
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-secondary" onClick={onClose} aria-label="Close">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * AuthForm - minimal email/password forms for sign in and sign up modes.
 */
function AuthForm({ mode = 'signin', onDone }) {
  const { notify } = useToast();
  const { signInWithEmailPassword, signUpWithEmailPassword, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState({});

  const isSignIn = mode === 'signin';

  const validate = useMemo(() => {
    return () => {
      const e = {};
      const em = (email || '').trim();
      const pw = (password || '').trim();
      if (!em) e.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(em)) e.email = 'Enter a valid email';
      if (!pw) e.password = 'Password is required';
      else if (pw.length < 6) e.password = 'Password must be 6+ characters';
      setErrors(e);
      return Object.keys(e).length === 0;
    };
  }, [email, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isSignIn) {
        await signInWithEmailPassword(email, password);
        notify('Signed in successfully', 'success');
      } else {
        await signUpWithEmailPassword(email, password);
        notify('Sign up successful. Please check your email to confirm (if required).', 'success');
      }
      onDone?.();
    } catch (_err) {
      notify(isSignIn ? 'Unable to sign in' : 'Unable to sign up', 'error');
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label htmlFor={`auth-email-${mode}`} style={{ display: 'block', marginBottom: 6 }}>Email</label>
          <input
            id={`auth-email-${mode}`}
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `auth-email-error-${mode}` : undefined}
          />
          {errors.email && <div id={`auth-email-error-${mode}`} style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
        </div>

        <div>
          <label htmlFor={`auth-password-${mode}`} style={{ display: 'block', marginBottom: 6 }}>Password</label>
          <input
            id={`auth-password-${mode}`}
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? `auth-password-error-${mode}` : undefined}
          />
          {errors.password && <div id={`auth-password-error-${mode}`} style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? (isSignIn ? 'Signing in…' : 'Signing up…') : (isSignIn ? 'Sign In' : 'Sign Up')}
        </button>
      </div>
    </form>
  );
}
