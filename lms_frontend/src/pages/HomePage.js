import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Loading from '../components/Loading';

/** 
 * PUBLIC_INTERFACE
 * HomePage - shows role-aware welcome for employees (non-admin/hr).
 */
export default function HomePage() {
  const { user, role, loading, rolesLoading } = useAuth();

  if (loading || rolesLoading) {
    return <Loading label="Preparing your dashboard..." />;
  }

  const isAuthed = !!user;
  const isAdmin = role === 'admin';
  const isHR = role === 'hr';
  const showEmployeeWelcome = isAuthed && !isAdmin && !isHR;

  return (
    <div className="card" style={{ padding: '1.5rem', background: 'var(--oc-gradient)' }}>
      {showEmployeeWelcome ? (
        <>
          <div className="badge" style={{ marginBottom: 8, borderColor: 'var(--oc-primary)' }}>
            Welcome Employee
          </div>
          <h1 style={{ marginTop: 0 }}>
            {user?.email ? `Hello, ${user.email}` : 'Employee Dashboard'}
          </h1>
          <p style={{ color: 'var(--oc-muted-text)' }}>
            Track your assignments, view lessons, and monitor your learning progress.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <Link to="/profile" className="btn">My Profile</Link>
            <Link to="/courses" className="btn btn-secondary">Browse Courses</Link>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ marginTop: 0 }}>Welcome {user?.email ? `, ${user.email}` : ''}</h1>
          <p style={{ color: 'var(--oc-muted-text)' }}>
            Track your progress and enhance your skills.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {isAuthed ? (
              <Link to="/profile" className="btn">Go to Profile</Link>
            ) : (
              <>
                <Link to="/auth/login?role=admin" className="btn btn-secondary">Admin Sign In</Link>
                <Link to="/auth/login?role=hr" className="btn btn-secondary">HR Sign In</Link>
                <Link to="/auth/login?role=employee" className="btn">Employee Sign In</Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
