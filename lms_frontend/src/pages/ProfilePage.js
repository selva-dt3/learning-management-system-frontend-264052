import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

// PUBLIC_INTERFACE
export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const onSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      notify('Signed out successfully', 'success');
    } catch (e) {
      notify('Sign out failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0 }}>Profile</h2>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: 'var(--oc-muted-text)' }}>Logged in as</div>
        <div style={{ fontWeight: 600 }}>{user?.email}</div>
      </div>
      <button className="btn" onClick={onSignOut} disabled={loading}>
        {loading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
