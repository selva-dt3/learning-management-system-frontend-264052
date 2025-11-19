import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

/**
 * PUBLIC_INTERFACE
 * AppRouter is the main application component setting up routes and providers.
 *
 * Note: BrowserRouter wraps AuthProvider to ensure any useNavigate calls inside AuthProvider
 * run within Router context.
 */
export default function AppRouter() {
  useEffect(() => {
    injectThemeCSSVariables();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailsPage />} />
                <Route path="/auth/login" element={<Login />} />
                {/* Keep /auth/signup but it redirects to /auth/login via component */}
                <Route path="/auth/signup" element={<Signup />} />
                {/* Backward compatibility: keep /login pointing to new page */}
                <Route path="/login" element={<Login />} />
                {/* Defensive: if /signup (without /auth) is tried, redirect to login */}
                <Route path="/signup" element={<Navigate to="/auth/login" replace />} />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/employees"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <EmployeesListPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/employees/new"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <EmployeeFormPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/employees/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <EmployeeFormPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/lessons"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <LessonsListPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/lessons/new"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <LessonFormPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/lessons/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <LessonFormPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/hr"
                  element={
                    <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                      <HRDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/hr/assignments"
                  element={
                    <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                      <AssignmentsPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/hr/assignments/new"
                  element={
                    <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                      <AssignmentFormPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/hr/assignments/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                      <AssignmentFormPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/hr/progress"
                  element={
                    <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                      <ProgressPage />
                    </RoleProtectedRoute>
                  }
                />
              </Routes>
            </MainLayout>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
