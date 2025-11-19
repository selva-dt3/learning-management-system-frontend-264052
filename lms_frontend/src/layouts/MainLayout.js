import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Header from '../components/Header';

function NavbarLinks() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const isHR = role === 'hr' || role === 'admin';

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--oc-primary)', boxShadow: 'var(--oc-shadow-sm)'
          }} />
          <span style={{ fontWeight: 800, color: '#0f172a' }}>LMS</span>
        </Link>
        <div className="hidden-mobile" style={{ display: 'flex', gap: 12, marginLeft: 16 }}>
          <NavLink to="/" end className="badge">Home</NavLink>
          <NavLink to="/courses" className="badge">Courses</NavLink>
          {isHR && (
            <>
              <NavLink to="/hr" className="badge">HR</NavLink>
              <NavLink to="/hr/assignments" className="badge">Assignments</NavLink>
              <NavLink to="/hr/progress" className="badge">Progress</NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin" className="badge">Admin</NavLink>
              <NavLink to="/admin/employees" className="badge">Employees</NavLink>
              <NavLink to="/admin/lessons" className="badge">Lessons</NavLink>
            </>
          )}
        </div>
      </div>
      <div className="hidden-mobile" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '1rem', textAlign: 'center' }}>
        <small>© {new Date().getFullYear()} LMS • Ocean Professional theme</small>
      </div>
    </footer>
  );
}

// PUBLIC_INTERFACE
export default function MainLayout({ children }) {
  // Removed sidebar/Categories; keep a clean main content area with consistent spacing.
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '1rem', flex: 1 }}>
        <main style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
