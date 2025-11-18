/**
 * ErrorBoundary to catch unexpected errors and display a friendly message.
 */
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // PUBLIC_INTERFACE
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // PUBLIC_INTERFACE
  componentDidCatch(error, info) {
    // Avoid logging sensitive data
    // eslint-disable-next-line no-console
    console.error('UI error captured:', { message: error?.message, stack: error?.stack, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p>Please try again later.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
