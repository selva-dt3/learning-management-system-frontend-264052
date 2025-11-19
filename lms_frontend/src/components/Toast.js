import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({ notify: () => {} });

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, variant = 'info', timeout = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  const ariaLive = (variant) => {
    // errors should be assertive, others polite
    return variant === 'error' ? 'assertive' : 'polite';
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        style={{
          position: 'fixed', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="card"
            role="status"
            aria-live={ariaLive(t.variant)}
            style={{
              padding: '0.75rem 1rem',
              borderLeft: `4px solid ${t.variant === 'error' ? 'var(--oc-error)' : t.variant === 'success' ? 'var(--oc-success)' : 'var(--oc-primary)'}`
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2, color: '#111827' }}>
              {t.variant === 'error' ? 'Error' : t.variant === 'success' ? 'Success' : 'Notice'}
            </div>
            <div style={{ color: 'var(--oc-muted-text)' }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  return useContext(ToastContext);
}
