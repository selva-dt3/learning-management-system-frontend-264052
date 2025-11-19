import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, signOut } from '../lib/auth';
import { useToast } from './Toast';

/**
 * PUBLIC_INTERFACE
 * Header component showing session-aware actions:
 * - When unauthenticated: Sign In and Sign Up links to dedicated routes.
 * - When authenticated: show user email and Sign Out.
 * Styling follows Ocean Professional theme variables.
 */
export default function Header() {
  const { user } = useAuth();
  const { notify } = useToast();

  const onSignOut = async () => {
    try {
      await signOut();
      notify('Signed out', 'success');
    } catch (_e) {
      notify('Unable to sign out', 'error');
    }
  };

  return (
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
              <Link className="btn btn-secondary" to="/auth/login">Sign In</Link>
              <Link className="btn" to="/auth/signup">Sign Up</Link>
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
  );
}
