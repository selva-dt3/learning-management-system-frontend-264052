# LMS Frontend (React) — Ocean Professional

A minimal LMS frontend scaffolded with routing, Ocean Professional theme, Supabase authentication, and role-based access control (RBAC).

## Features
- Routing with react-router: `/`, `/courses`, `/courses/:id`, `/profile` (protected), `/login`
- RBAC with Supabase: `/admin` (admin only), `/hr` (hr and admin)
- Ocean Professional theme (modern, subtle shadows, rounded corners, gradients)
- Supabase auth wiring (email/password), session-aware layout and role-aware navigation
- Header with Sign In/Sign Up modals and Sign Out control
- Placeholder pages: Home, Courses (search/filter UI), Course Details, Profile, Login
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

### Added Auth UI
- A session-aware Header is rendered globally. When signed out, it shows Sign In/Sign Up modals (email/password). When signed in, it shows the user email and Sign Out button.

## RBAC and Supabase Profiles

This app resolves the current user's role from the `profiles` table or, as a fallback, from the user metadata.

- Expected roles: `admin`, `hr`, `learner` (default)
- Routes:
  - `/admin` → requires `admin`
  - `/hr` → requires `hr` or `admin`
- Navigation:
  - "Admin" link appears only for `admin`
  - "HR" link appears for `hr` and `admin`

Auth context provides `{ user, session, role, loading, refreshSession }`.

### Required Supabase Schema

Create a `profiles` table linked to `auth.users`:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text check (role in ('admin','hr','learner')) default 'learner'
);
```

Enable RLS and allow reads for authenticated users:

```sql
alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);
```

For development convenience, the app treats missing roles as `learner`.

(See the remainder of this README for suggested schema and RLS examples for employees, lessons, assignments, and progress.)

## Key Files
- `src/lib/supabaseClient.js` — Supabase client (uses REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY)
- `src/lib/auth.js` — Auth helpers, `AuthProvider`/`useAuth`, `ProtectedRoute`, and `RoleProtectedRoute`
- `src/components/Header.js` — session-aware header with auth controls
- `src/lib/services/roles.js` — Role resolution logic

## Security
- No secrets are hardcoded; environment-only configuration using:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_KEY`
- No sensitive data logged
- Client-side input validation on auth forms

## Scripts
- `npm start` — start development server
- `npm build` — build production bundle
- `npm test` — run tests

```diff
Important:
- Ensure .env is not committed.
- Provide valid Supabase URL and anon/public key.
```
