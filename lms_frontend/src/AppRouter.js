import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import ProfilePage from './pages/ProfilePage';
import { ProtectedRoute, AuthProvider, RoleProtectedRoute } from './lib/auth';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { injectThemeCSSVariables } from './styles/theme';
import './styles/global.css';
import AdminDashboard from './pages/admin/AdminDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import EmployeesListPage from './pages/admin/employees/EmployeesListPage';
import EmployeeFormPage from './pages/admin/employees/EmployeeFormPage';
import LessonsListPage from './pages/admin/lessons/LessonsListPage';
import LessonFormPage from './pages/admin/lessons/LessonFormPage';
import AssignmentsPage from './pages/hr/AssignmentsPage';
import AssignmentFormPage from './pages/hr/AssignmentFormPage';
import ProgressPage from './pages/hr/ProgressPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

/**
 * PUBLIC_INTERFACE
 * AppRouter is the main application component setting up routes and providers.
 *
 * The router uses React Router's Data APIs (createBrowserRouter + RouterProvider)
 * with v7 future flags enabled to silence deprecation warnings while preserving
 * current behavior.
 */
export default function AppRouter() {
  useEffect(() => {
    injectThemeCSSVariables();
    // eslint-disable-next-line no-console
    console.debug?.('[AppRouter] mounted');
  }, []);

  // Define routes using route objects while keeping existing elements/guards.
  const router = createBrowserRouter(
    [
      {
        path: '/',
        element: (
          <MainLayout>
            <HomePage />
          </MainLayout>
        ),
      },
      {
        path: '/courses',
        element: (
          <MainLayout>
            <CoursesPage />
          </MainLayout>
        ),
      },
      {
        path: '/courses/:id',
        element: (
          <MainLayout>
            <CourseDetailsPage />
          </MainLayout>
        ),
      },
      {
        path: '/auth/login',
        element: (
          <MainLayout>
            <Login />
          </MainLayout>
        ),
      },
      {
        // Kept for backward compatibility (component handles redirect UX)
        path: '/auth/signup',
        element: (
          <MainLayout>
            <Signup />
          </MainLayout>
        ),
      },
      {
        // Backward compatibility: /login -> Login
        path: '/login',
        element: (
          <MainLayout>
            <Login />
          </MainLayout>
        ),
      },
      {
        // Defensive: redirect bare /signup to new login route
        path: '/signup',
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: '/profile',
        element: (
          <MainLayout>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/employee',
        element: (
          <MainLayout>
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin/employees',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <EmployeesListPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin/employees/new',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <EmployeeFormPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin/employees/:id',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <EmployeeFormPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin/lessons',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <LessonsListPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin/lessons/new',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <LessonFormPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/admin/lessons/:id',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['admin']}>
              <LessonFormPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/hr',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
              <HRDashboard />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/hr/assignments',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
              <AssignmentsPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/hr/assignments/new',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
              <AssignmentFormPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/hr/assignments/:id',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
              <AssignmentFormPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
      {
        path: '/hr/progress',
        element: (
          <MainLayout>
            <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
              <ProgressPage />
            </RoleProtectedRoute>
          </MainLayout>
        ),
      },
    ],
    {
      // Enable React Router v7 future flags to silence warnings and prep for v7 behavior
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        {/* RouterProvider MUST wrap AuthProvider to ensure useNavigate has Router context */}
        <RouterProvider router={router}>
          <AuthProvider>
            {/* Children of AuthProvider are rendered by the route elements within RouterProvider */}
            {/* MainLayout and route elements are defined in the router above */}
          </AuthProvider>
        </RouterProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
