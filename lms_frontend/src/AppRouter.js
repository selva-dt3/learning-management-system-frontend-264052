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
import { ProtectedRoute, AuthProvider } from './lib/auth';
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
import { adminCourseRoutes } from './pages/admin/courses/routes.register';

/**
 * PUBLIC_INTERFACE
 * AppRouter sets up the application's routes and providers.
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
  const baseRoutes = [
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
            <AdminDashboard />
          </MainLayout>
        ),
      },
      {
        path: '/admin/employees',
        element: (
          <MainLayout>
            <EmployeesListPage />
          </MainLayout>
        ),
      },
      {
        path: '/admin/employees/new',
        element: (
          <MainLayout>
            <EmployeeFormPage />
          </MainLayout>
        ),
      },
      {
        path: '/admin/employees/:id',
        element: (
          <MainLayout>
            <EmployeeFormPage />
          </MainLayout>
        ),
      },
      {
        path: '/admin/lessons',
        element: (
          <MainLayout>
            <LessonsListPage />
          </MainLayout>
        ),
      },
      {
        path: '/admin/lessons/new',
        element: (
          <MainLayout>
            <LessonFormPage />
          </MainLayout>
        ),
      },
      {
        path: '/admin/lessons/:id',
        element: (
          <MainLayout>
            <LessonFormPage />
          </MainLayout>
        ),
      },
      {
        path: '/hr',
        element: (
          <MainLayout>
            <HRDashboard />
          </MainLayout>
        ),
      },
      {
        path: '/hr/assignments',
        element: (
          <MainLayout>
            <AssignmentsPage />
          </MainLayout>
        ),
      },
      {
        path: '/hr/assignments/new',
        element: (
          <MainLayout>
            <AssignmentFormPage />
          </MainLayout>
        ),
      },
      {
        path: '/hr/assignments/:id',
        element: (
          <MainLayout>
            <AssignmentFormPage />
          </MainLayout>
        ),
      },
      {
        path: '/hr/progress',
        element: (
          <MainLayout>
            <ProgressPage />
          </MainLayout>
        ),
      },
    ];
  const router = createBrowserRouter(
    [
      ...baseRoutes,
      ...adminCourseRoutes,
    ],
    {
      // Enable React Router v7 future flags to silence warnings and prep for v7 behavior
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );

  // eslint-disable-next-line no-console
  console.log('[RouterInit] React Router v7 flags active', {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  });

  // Ensure RouterProvider (Router) wraps AuthProvider so any useNavigate in AuthProvider has router context.
  // eslint-disable-next-line no-console
  console.log('[ProviderOrder] Rendering: ErrorBoundary -> ToastProvider -> RouterProvider -> AuthProvider -> Routes');

  return (
    <ErrorBoundary>
      <ToastProvider>
        <RouterProvider router={router}>
          <AuthProvider>
            {/* App routes are rendered by RouterProvider internally via route objects */}
          </AuthProvider>
        </RouterProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
