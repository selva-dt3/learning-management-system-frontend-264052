import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * AccessDenied - Friendly 403 style component with theme styling.
 */
export default function AccessDenied({ message = 'You do not have permission to view this page.' }) {
  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="badge" style={{ background: '#fff3f3', borderColor: 'var(--oc-error)', color: '#7f1d1d', marginBottom: 8 }}>
          403
        </div>
        <h2 style={{ marginTop: 0 }}>Access denied</h2>
        <p style={{ color: 'var(--oc-muted-text)' }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-secondary" to="/">Go Home</Link>
          <Link className="btn" to="/auth/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
