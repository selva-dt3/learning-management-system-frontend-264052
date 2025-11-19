import React from 'react';
import AppRouter from './AppRouter';

// PUBLIC_INTERFACE
function App() {
  /**
   * Root component that delegates to AppRouter.
   * AppRouter ensures RouterProvider wraps AuthProvider to satisfy useNavigate context.
   */
  return <AppRouter />;
}

export default App;
