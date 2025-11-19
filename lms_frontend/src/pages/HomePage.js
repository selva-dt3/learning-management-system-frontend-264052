import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// PUBLIC_INTERFACE
export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h1 style={{ marginTop: 0 }}>Welcome {user?.email ? `, ${user.email}` : ''}</h1>
      <p style={{ color: 'var(--oc-muted-text)' }}>
        Track your progress and enhance your skills.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        {user?.email ? (
          <Link to="/profile" className="btn">Go to Profile</Link>
        ) : (
          <>
            <Link to="/auth/login?role=admin" className="btn btn-secondary">Admin Sign In</Link>
            <Link to="/auth/login?role=hr" className="btn btn-secondary">HR Sign In</Link>
            <Link to="/auth/login?role=employee" className="btn">Employee Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
