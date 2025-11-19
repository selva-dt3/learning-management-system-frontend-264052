import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Loading - A small themed loading indicator.
 */
export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="card" style={{ padding: '1rem', display: 'inline-block' }}>
        <div className="badge" style={{ marginBottom: 8 }}>Please wait</div>
        <div aria-busy="true" aria-live="polite">{label}</div>
      </div>
    </div>
  );
}
