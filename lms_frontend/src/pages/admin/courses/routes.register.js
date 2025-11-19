import React from 'react';
import MainLayout from '../../../layouts/MainLayout';
import AdminCoursesPage from './AdminCoursesPage';
import AdminCourseDetailPage from './AdminCourseDetailPage';

// PUBLIC_INTERFACE
export const adminCourseRoutes = [
  {
    path: '/admin/courses',
    element: (
      <MainLayout>
        <AdminCoursesPage />
      </MainLayout>
    ),
  },
  {
    path: '/admin/courses/:id',
    element: (
      <MainLayout>
        <AdminCourseDetailPage />
      </MainLayout>
    ),
  },
];
