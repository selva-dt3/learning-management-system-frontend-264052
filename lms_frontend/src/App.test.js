import { render, screen } from '@testing-library/react';
import App from './App';

// Mock useAuth to control role/session state in tests
jest.mock('./lib/auth', () => {
  const original = jest.requireActual('./lib/auth');
  return {
    ...original,
    useAuth: jest.fn()
  };
});

describe('navigation visibility', () => {
  test('admin and hr links hidden for non-admin/hr', () => {
    const { useAuth } = require('./lib/auth');
    useAuth.mockReturnValue({ session: null, role: 'learner' });

    render(<App />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    // Admin specific links should not be visible for non-admin (and unauthenticated)
    expect(screen.queryByText('Admin')).toBeNull();
    expect(screen.queryByText('Employees')).toBeNull();
    expect(screen.queryByText('Lessons')).toBeNull();
    // HR links should also be hidden
    expect(screen.queryByText('HR')).toBeNull();
    expect(screen.queryByText('Assignments')).toBeNull();
    expect(screen.queryByText('Progress')).toBeNull();
  });

  test('admin links visible for admin', () => {
    const { useAuth } = require('./lib/auth');
    useAuth.mockReturnValue({ session: { user: { id: '1' } }, role: 'admin' });

    render(<App />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    // HR links are visible for admin as well
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('Assignments')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  test('hr links visible for hr', () => {
    const { useAuth } = require('./lib/auth');
    useAuth.mockReturnValue({ session: { user: { id: '2' } }, role: 'hr' });

    render(<App />);
    // Admin links should be hidden for hr (non-admin)
    expect(screen.queryByText('Admin')).toBeNull();
    expect(screen.queryByText('Employees')).toBeNull();
    expect(screen.queryByText('Lessons')).toBeNull();

    // HR links visible
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('Assignments')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });
});
