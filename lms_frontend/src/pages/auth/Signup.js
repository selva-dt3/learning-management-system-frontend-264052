import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';

/**
 * PUBLIC_INTERFACE
 * Signup - Dedicated signup page with email/password and confirm password.
 * Uses Supabase via AuthProvider methods, includes validation and UX states.
 */
export default function Signup() {
  const { signUpWithEmailPassword } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const postSignupRedirect = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = useMemo(() => {
    return () => {
      const e = {};
      const email = (form.email || '').trim();
      const password = (form.password || '').trim();
      const confirm = (form.confirm || '').trim();

      if (!email) e.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
      if (!password) e.password = 'Password is required';
      else if (password.length < 6) e.password = 'Password must be 6+ characters';
      if (!confirm) e.confirm = 'Please confirm password';
      else if (confirm !== password) e.confirm = 'Passwords do not match';

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
      await signUpWithEmailPassword(form.email, form.password);
      notify('Sign up successful. Check your email to confirm (if required).', 'success');
      navigate(postSignupRedirect, { replace: true });
    } catch (_err) {
      setSubmitError('Unable to sign up. Please try again.');
      notify('Unable to sign up', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '1.25rem', width: '100%', maxWidth: 480, marginTop: '2rem' }}>
        <div style={{ marginBottom: 12 }}>
          <div className="badge" style={{ marginBottom: 8 }}>Get started</div>
          <h2 style={{ margin: 0 }}>Create your account</h2>
          <p style={{ color: 'var(--oc-muted-text)', marginTop: 6 }}>
            Sign up to start learning.
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
              <label htmlFor="signup-email" style={{ display: 'block', marginBottom: 6 }}>Email</label>
              <input
                id="signup-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && <div id="signup-email-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
            </div>

            <div>
              <label htmlFor="signup-password" style={{ display: 'block', marginBottom: 6 }}>Password</label>
              <input
                id="signup-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
                autoComplete="new-password"
              />
              {errors.password && <div id="signup-password-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
            </div>

            <div>
              <label htmlFor="signup-confirm" style={{ display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? 'signup-confirm-error' : undefined}
                autoComplete="new-password"
              />
              {errors.confirm && <div id="signup-confirm-error" style={{ color: 'var(--oc-error)', fontSize: 12, marginTop: 4 }}>{errors.confirm}</div>}
            </div>

            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 12, color: 'var(--oc-muted-text)' }}>
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
