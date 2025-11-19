import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from './Toast';

/**
 * PUBLIC_INTERFACE
 * Header component showing session-aware actions and contextual role links.
 * - When unauthenticated: three role-specific sign-in buttons (Admin, HR, Employee) that link to /auth/login?role=...
 * - When authenticated: show user email, Admin/HR links (if authorized), and Sign Out.
 * Styling follows Ocean Professional theme variables.
 */
export default function Header() {
  const { user, role, signOut } = useAuth();
  const { notify } = useToast();
  const [signingOut, setSigningOut] = React.useState(false);

  // eslint-disable-next-line no-console
  console.debug?.('[Header] user/role', { userId: user?.id, email: user?.email, role });

  const onSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      notify('Signed out', 'success');
    } catch (_e) {
      notify('Unable to sign out', 'error');
    } finally {
      setSigningOut(false);
    }
  };

  const isAdmin = role === 'admin';
  const isHR = role === 'hr' || role === 'admin';
  const showEmployeeLink = !!user && !(role === 'admin' || role === 'hr');

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
          <Link to="/" aria-label="Home">
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--oc-primary)', boxShadow: 'var(--oc-shadow-sm)'
            }} />
          </Link>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>LMS</span>
          <div style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
            <Link className="badge" to="/hr">HR</Link>
            <Link className="badge" to="/admin">Admin</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!user && (
            <>
              <Link className="btn btn-secondary" to="/hr" aria-label="Go to HR">HR</Link>
              <Link className="btn btn-secondary" to="/admin" aria-label="Go to Admin">Admin</Link>
              <Link className="btn" to="/auth/login?role=employee" aria-label="Employee Sign In">Employee Sign In</Link>
            </>
          )}
          {user && (
            <>
              {showEmployeeLink && (
                <Link className="btn" to="/employee" aria-label="My Dashboard">My Dashboard</Link>
              )}
              <span className="badge" aria-label="Signed in email" title={user.email}>{user.email}</span>
              <button className="btn btn-secondary" onClick={onSignOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
