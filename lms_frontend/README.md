# LMS Frontend (React) — Ocean Professional

A minimal LMS frontend scaffolded with routing, Ocean Professional theme, Supabase authentication, and role-based access control (RBAC).

## Features
- Routing with react-router: `/`, `/courses`, `/courses/:id`, `/profile` (protected), `/login`
- RBAC with Supabase: `/admin` (admin only), `/hr` (hr and admin)
- Ocean Professional theme (modern, subtle shadows, rounded corners, gradients)
- Supabase auth wiring (email/password), session-aware layout and role-aware navigation
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

Row Level Security and policy (allow users to select their own row; write policies as appropriate for your needs):

```sql
alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);
```

Optionally allow users to upsert their own profile row if you create UI for it:

```sql
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

For development convenience, the app treats missing roles as `learner`.

### Where Roles Are Resolved

- `src/lib/services/roles.js` — encapsulates role fetching from `profiles` (primary) and `user_metadata.role` (fallback)
- `src/lib/auth.js` — `AuthProvider` loads and stores the role; exposes `getUserRole` and `RoleProtectedRoute`

## Key Files
- `src/lib/supabaseClient.js` — Supabase client (uses REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY)
- `src/lib/auth.js` — Auth helpers, `AuthProvider`/`useAuth`, `ProtectedRoute`, and `RoleProtectedRoute`
- `src/lib/services/roles.js` — Role resolution logic
- `src/pages/admin/AdminDashboard.js` — Admin dashboard
- `src/pages/hr/HRDashboard.js` — HR dashboard

## Project Structure
```
src/
  components/
    ErrorBoundary.js
    Toast.js
  layouts/
    MainLayout.js
  lib/
    apiClient.js
    auth.js
    supabaseClient.js
    services/
      roles.js
  pages/
    CourseDetailsPage.js
    CoursesPage.js
    HomePage.js
    LoginPage.js
    ProfilePage.js
    admin/
      AdminDashboard.js
    hr/
      HRDashboard.js
  styles/
    global.css
    theme.js
  App.js
  AppRouter.js
  index.js
```

## Styling
- Centralized theme in `src/styles/theme.js` sets CSS variables at runtime.
- Base global styles in `src/styles/global.css` define utilities (card, btn, input, container, etc).

## Security
- No secrets are hardcoded; environment-only configuration using:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_KEY`
- No sensitive data logged
- Simple client-side input validation on Login form

## Scripts
- `npm start` — start development server
- `npm build` — build production bundle
- `npm test` — run tests

```diff
Important:
- Ensure .env is not committed.
- Provide valid Supabase URL and anon/public key.
```
