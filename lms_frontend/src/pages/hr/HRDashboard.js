import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

// PUBLIC_INTERFACE
export default function HRDashboard() {
  /**
   * HR dashboard with quick stats and HR-related links.
   * Visible to users with role 'hr' or 'admin'.
   */
  const { user, role } = useAuth();

  return (
    // Page is guarded by RoleProtectedRoute in AppRouter (hr or admin).
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>HR Dashboard</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              Hello {user?.email || ''}. Assign lessons and track team progress.
            </div>
          </div>
          <div className="badge" title="Your role" style={{ borderColor: 'var(--oc-secondary)', color: '#7c2d12' }}>
            Role: {role}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Assignments</div>
          <h3 style={{ marginTop: 0 }}>Pending Assignments</h3>
          <div style={{ fontSize: 28, fontWeight: 800 }}>12</div>
          <div style={{ color: 'var(--oc-muted-text)' }}>3 due today</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Progress</div>
          <h3 style={{ marginTop: 0 }}>Avg Completion</h3>
          <div style={{ height: 12, background: '#eef2ff', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--oc-border)' }}>
            <div style={{ width: '64%', height: '100%', background: 'var(--oc-primary)' }} />
          </div>
          <div style={{ marginTop: 8, color: 'var(--oc-muted-text)' }}>64% across teams</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/hr/assignments" className="btn">Assign Lessons</Link>
          <Link to="/hr/progress" className="btn btn-secondary">Track Progress</Link>
        </div>
      </div>
    </div>
  );
}
