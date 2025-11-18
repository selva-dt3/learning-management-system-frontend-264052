import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function Navbar() {
  const { session, role } = useAuth();
  const isAdmin = role === 'admin';
  const isHR = role === 'hr' || role === 'admin';

  return (
    <nav className="nav-gradient" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--oc-border)'
    }}>
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
            {isHR && <NavLink to="/hr" className="badge">HR</NavLink>}
            {isAdmin && (
              <>
                <NavLink to="/admin" className="badge">Admin</NavLink>
                <NavLink to="/admin/employees" className="badge">Employees</NavLink>
                <NavLink to="/admin/lessons" className="badge">Lessons</NavLink>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!session && <NavLink to="/login" className="badge">Login</NavLink>}
          <NavLink to="/profile" className="badge">Profile</NavLink>
        </div>
      </div>
    </nav>
  );
}

function Sidebar({ open }) {
  return (
    <aside className="hidden-mobile" style={{
      width: 260,
      flexShrink: 0,
      display: open ? 'block' : 'none'
    }}>
      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Categories</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="badge">All</span>
          <span className="badge">Development</span>
          <span className="badge">Design</span>
          <span className="badge">Marketing</span>
          <span className="badge">Data</span>
        </div>
      </div>
    </aside>
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
  const [sidebarOpen] = useState(true);

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ display: 'flex', gap: 16, paddingTop: '1rem', paddingBottom: '1rem', flex: 1 }}>
        <Sidebar open={sidebarOpen} />
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
