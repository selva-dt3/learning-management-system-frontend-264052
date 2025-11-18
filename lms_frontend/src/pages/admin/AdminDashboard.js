import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

// PUBLIC_INTERFACE
export default function AdminDashboard() {
  /**
   * Admin dashboard with quick stats and management links.
   * Visible to users with role 'admin'.
   */
  const { user, role } = useAuth();

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <div style={{ color: 'var(--oc-muted-text)' }}>
              Welcome {user?.email || ''}. Manage platform settings and content.
            </div>
          </div>
          <div className="badge" title="Your role" style={{ borderColor: 'var(--oc-primary)', color: '#0f172a' }}>
            Role: {role}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Users</div>
          <h3 style={{ marginTop: 0 }}>Total Employees</h3>
          <div style={{ fontSize: 28, fontWeight: 800 }}>128</div>
          <div style={{ color: 'var(--oc-muted-text)' }}>+4 this week</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="badge" style={{ marginBottom: 8 }}>Courses</div>
          <h3 style={{ marginTop: 0 }}>Published Lessons</h3>
          <div style={{ fontSize: 28, fontWeight: 800 }}>36</div>
          <div style={{ color: 'var(--oc-muted-text)' }}>2 in draft</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/employees" className="btn">Manage Employees</Link>
          <Link to="/admin/lessons" className="btn btn-secondary">Manage Lessons</Link>
        </div>
      </div>
    </div>
  );
}
