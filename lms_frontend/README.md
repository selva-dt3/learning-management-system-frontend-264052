# LMS Frontend (React) — Ocean Professional

A minimal LMS frontend with routing, Ocean Professional theme, Supabase authentication, and RLS-backed role-based access control (RBAC).

## Features
- Routing with react-router: `/`, `/courses`, `/courses/:id`, `/profile` (protected), `/auth/login`, `/auth/signup`
- RBAC with Supabase (RLS-backed from `public.user_roles`): `/admin` (admin only), `/hr` (hr and admin)
- Ocean Professional theme (primary #2563EB, amber accents #F59E0B), subtle shadows, rounded corners
- Supabase auth wiring (email/password), session-aware layout and role-aware navigation
- Contextual header links: HR/Admin links appear only if user has those roles
- Placeholder pages: Home, Courses, Course Details, Profile
- Dashboards: AdminDashboard and HRDashboard
- Error Boundary and toast notifications
- API client placeholder reading `REACT_APP_API_BASE`

## Getting Started

1) Install dependencies:
```bash
npm install
```

2) Configure environment:
- Copy `.env.example` to `.env`
- Provide values for:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_KEY`
- Optionally set `REACT_APP_API_BASE` for future API calls.

3) Run the app:
```bash
npm start
```
Open http://localhost:3000

### Supabase Notes
- The app reads environment variables only; no secrets are hardcoded.
- Required envs:
  - `REACT_APP_SUPABASE_URL` — e.g., `https://YOUR-REF.supabase.co`
  - `REACT_APP_SUPABASE_KEY` — anon/public key from your Supabase project
- Optional:
  - `REACT_APP_FRONTEND_URL` — used to set emailRedirectTo during signup.

## RBAC with Supabase RLS

This app resolves roles from `public.user_roles` with RLS enabled. Only SELECT is performed client-side.

- Expected roles: `admin`, `hr`, `learner` (default fallback)
- Table expectation (client is read-only):
  - `public.user_roles(user_id uuid references auth.users(id), role text)`
  - RLS policies must allow authenticated users to read their own rows.
- Fetching:
  - `src/lib/services/roles.js` reads all roles for the current user and normalizes them
  - Primary role is chosen by priority: admin > hr > learner
  - `fetchUserRoles(userId)` returns a unique array of roles
- Guards:
  - `ProtectedRoute` requires authentication; redirects to `/auth/login`
  - `RoleProtectedRoute` requires role membership; shows a themed 403 (AccessDenied) when unauthorized
- Redirects and Sign-out:
  - After login: If user has `admin` → `/admin`, else if `hr` → `/hr`, else → `/`
  - Sign-out: Header/Profile sign-out triggers Supabase `auth.signOut()`, immediately clears local auth/roles state in `AuthProvider`, and navigates to `/`. Protected routes react instantly to unauthenticated state.
- Navigation:
  - Header shows "HR" link when role is hr or admin
  - Header shows "Admin" link when role is admin

Treat missing roles gracefully as `learner`.

## Key Files
- `src/lib/supabaseClient.js` — Supabase client (uses REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY)
- `src/lib/auth.js` — Auth provider and guards (ProtectedRoute, RoleProtectedRoute), role-aware redirects
- `src/lib/services/roles.js` — RLS-backed role resolution from `public.user_roles`
- `src/components/Header.js` — session-aware header with role-aware navigation
- `src/components/Loading.js` — themed loading indicator
- `src/components/AccessDenied.js` — themed 403 component

## Security
- No secrets are hardcoded; environment-only configuration using:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_KEY`
- No sensitive data is logged
- Client-side input validation on auth forms
- Note: Database schema/policies are not modified by this app; ensure RLS policies are configured server-side.

## Scripts
- `npm start` — start development server
- `npm build` — build production bundle
- `npm test` — run tests

```diff
Important:
- Ensure .env is not committed.
- Provide valid Supabase URL and anon/public key.
- Ensure user RLS policies allow reading own rows from public.user_roles.
```
