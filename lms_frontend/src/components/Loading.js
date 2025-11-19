import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Loading - A themed loading indicator with optional timeout-based fallback and initial delay debounce.
 * Props:
 * - label: string (default 'Loading...')
 * - timeoutMs: number (default 10000). After this many ms, show actionable message.
 * - onTimeout: function (optional). Called when timeout triggers.
 * - troubleshooting: boolean (default true). Displays link to README_RLS_TROUBLESHOOTING.md on timeout.
 * - initialDelayMs: number (default 250). Debounce before showing spinner to avoid flicker on fast loads.
 */
export default function Loading({
  label = 'Loading...',
  timeoutMs = 10000,
  onTimeout,
  troubleshooting = true,
  initialDelayMs = 250
}) {
  const [timedOut, setTimedOut] = React.useState(false);
  const [visible, setVisible] = React.useState(initialDelayMs <= 0);

  React.useEffect(() => {
    let cancelled = false;
    // Debounce initial render to avoid flicker
    const delayTimer = setTimeout(() => {
      if (!cancelled) setVisible(true);
    }, Math.max(0, initialDelayMs));

    // Timeout to convert to actionable state
    const timeoutTimer = timeoutMs
      ? setTimeout(() => {
          if (!cancelled) {
            setTimedOut(true);
            // eslint-disable-next-line no-console
            console.warn('[Loading] Timed out while waiting for data.');
            onTimeout && onTimeout();
          }
        }, timeoutMs)
      : null;

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [timeoutMs, onTimeout, initialDelayMs]);

  if (!visible) return null;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="card" style={{ padding: '1rem', display: 'inline-block', maxWidth: 560 }}>
        <div className="badge" style={{ marginBottom: 8 }}>Please wait</div>
        <div aria-busy="true" aria-live="polite">{label}</div>
        {timedOut && (
          <div style={{ marginTop: 12, color: '#7f1d1d', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10 }}>
            Data is taking longer than expected. This can be due to access policies (RLS) or missing setup.
            {troubleshooting && (
              <div style={{ marginTop: 6 }}>
                <a href="/README_RLS_TROUBLESHOOTING.md" target="_blank" rel="noreferrer" className="badge">Open RLS Troubleshooting</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
