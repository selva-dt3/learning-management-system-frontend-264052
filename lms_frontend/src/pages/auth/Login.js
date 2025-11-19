import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, signInWithEmail } from '../../lib/auth';
import { useToast } from '../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * Login - Dedicated login page using Supabase auth via existing auth helpers.
 * Reads ?role=admin|hr|employee from query parameters to adjust UI text, but authentication remains email/password.
 * Signup paths are intentionally hidden/disabled.
 */
export default function Login() {
  const { session } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const search = new URLSearchParams(location.search || '');
  const qpRole = (search.get('role') || '').toLowerCase();
  const roleHint = qpRole === 'admin' || qpRole === 'hr' || qpRole === 'employee' ? qpRole : '';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // already logged in, redirect to intended page
  if (session) {
    // eslint-disable-next-line no-console
    console.debug?.('[Login] already authenticated, redirecting to', from);
    navigate(from, { replace: true });
  }

  const validate = useMemo(() => {
    return () => {
      const e = {};
      const email = (form.email || '').trim();
      const password = (form.password || '').trim();
      if (!email) e.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
      if (!password) e.password = 'Password is required';
      else if (password.length < 6) e.password = 'Password must be 6+ characters';
      setErrors(e);
      return Object.keys(e).length === 0;
    };
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    try {
      setSubmitting(true);
      await signInWithEmail(form.email, form.password);
      notify('Signed in successfully', 'success');
      // AuthProvider will handle role-based redirects after roles load.
      // eslint-disable-next-line no-console
      console.debug?.('[Login] sign-in initiated, waiting for AuthProvider redirect');
    } catch (_err) {
      setSubmitError('Unable to sign in. Please check your credentials.');
      notify('Unable to sign in', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const title = roleHint === 'admin' ? 'Admin Sign In'
    : roleHint === 'hr' ? 'HR Sign In'
    : roleHint === 'employee' ? 'Employee Sign In'
    : 'Sign In';

  const subtitle = roleHint
    ? `Sign in to continue as ${roleHint}.`
    : 'Access your learning dashboard.';

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '1.25rem', width: '100%', maxWidth: 480, marginTop: '2rem' }}>
        <div style={{ marginBottom: 12 }}>
          <div className="badge" style={{ marginBottom: 8 }}>Welcome back</div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={{ color: 'var(--oc-muted-text)', marginTop: 6 }}>
            {subtitle}
          </p>
        </div>

        {submitError && (
          <div className="card" style={{ padding: '0.75rem', marginBottom: 12, borderColor: 'var(--oc-error)' }}>
            <div style={{ color: 'var(--oc-error)' }}>{submitError}</div>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', marginBottom: 6 }}>Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && <div id="login-email-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', marginBottom: 6 }}>Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                autoComplete="current-password"
              />
              {errors.password && <div id="login-password-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
            </div>

            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
