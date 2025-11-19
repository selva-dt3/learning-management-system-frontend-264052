# Project Repository

This repository contains the LMS frontend implemented with React (Ocean Professional styling) and Supabase integration for auth, lessons, assignments, and progress tracking.

Highlights:
- Admin and HR dashboards enhanced with:
  - Form validation (required fields, file/email patterns, file type/size)
  - Tabular listings with search/filter and pagination
  - Edit and delete actions with confirmation dialogs
  - Clear surfacing of Supabase errors with actionable hints
- Lightweight services (src/lib/services) for lessons, courses, assignments, progress using Supabase client.
- Role guards preserved (admin-only, hr-only).
- See lms_frontend/README.md for detailed setup and SQL index recommendations.
