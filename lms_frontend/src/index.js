import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './AppRouter';

/**
 * Entry point: renders AppRouter so provider order becomes Router -> AuthProvider -> App (routes).
 * AppRouter already composes ErrorBoundary, ToastProvider, RouterProvider, and AuthProvider.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {console.log('[Root] Rendering <AppRouter/>')}
    <AppRouter />
  </React.StrictMode>
);
