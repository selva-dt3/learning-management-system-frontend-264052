import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmail, useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

// PUBLIC_INTERFACE
export default function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const from = location.state?.from?.pathname || '/';

  const search = new URLSearchParams(location.search || '');
  const qpRole = (search.get('role') || '').toLowerCase();
  const roleHint = qpRole === 'admin' || qpRole === 'hr' || qpRole === 'employee' ? qpRole : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    // Already logged in, redirect quickly
    // eslint-disable-next-line no-console
    console.debug?.('[LoginPage] already authenticated, redirecting to', from);
    navigate(from, { replace: true });
  }

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!password.trim()) e.password = 'Password is required';
    if (password.trim() && password.trim().length < 6) e.password = 'Password must be 6+ characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await signInWithEmail(email, password);
      notify('Signed in successfully', 'success');
      // No forced post-login redirect. If a referrer exists, it will be handled by router state in this component.
      // eslint-disable-next-line no-console
      console.debug?.('[LoginPage] sign-in initiated');
    } catch (_e) {
      notify('Unable to sign in. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const title = roleHint === 'admin' ? 'Admin Sign In'
    : roleHint === 'hr' ? 'HR Sign In'
    : roleHint === 'employee' ? 'Employee Sign In'
    : 'Sign in';

  return (
    <div className="card" style={{ padding: '1.25rem', maxWidth: 440, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--oc-muted-text)', marginTop: 0, marginBottom: 16 }}>
        Enter your email and password to access your account.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <div id="email-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 6 }}>Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && <div id="password-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
          </div>

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
}
