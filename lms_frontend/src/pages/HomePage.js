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
        Explore courses, track your progress, and enhance your skills.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <Link to="/courses" className="btn">Browse Courses</Link>
        {user?.email ? (
          <Link to="/profile" className="btn btn-secondary">Go to Profile</Link>
        ) : (
          <Link to="/auth/login" className="btn btn-secondary">Sign In</Link>
        )}
      </div>
    </div>
  );
}
