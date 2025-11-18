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

### Employees and Lessons Tables

Suggested schema for admin features:

```sql
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  department text,
  role text check (role in ('employee','hr','admin')) default 'employee',
  status text check (status in ('active','inactive')) default 'active',
  created_at timestamp with time zone default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  difficulty text check (difficulty in ('beginner','intermediate','advanced')) default 'beginner',
  duration_minutes integer,
  is_published boolean default false,
  created_at timestamp with time zone default now()
);

-- HR Features: Assignments and Progress
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  assigned_by uuid default auth.uid(),
  assigned_at timestamp with time zone default now(),
  due_date date,
  status text check (status in ('pending','in_progress','completed','overdue')) default 'pending'
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status text check (status in ('pending','in_progress','completed','overdue')) default 'pending',
  percent_complete numeric check (percent_complete >= 0 and percent_complete <= 100) default 0,
  last_activity_at timestamp with time zone default now(),
  notes text
);

alter table public.assignments enable row level security;
alter table public.progress enable row level security;

-- Example RLS Policies (adjust for your setup)
-- Grant read/write on assignments to users with HR role; others read-own or as permitted.
-- This example uses a JWT custom claim user_role; you can also join with profiles via policies.
create policy "Assignments readable to HR"
on public.assignments
for select
to authenticated
using (auth.jwt() ?->> 'user_role' in ('hr','admin'));

create policy "Assignments writable by HR"
on public.assignments
for all
to authenticated
using (auth.jwt() ?->> 'user_role' in ('hr','admin'))
with check (auth.jwt() ?->> 'user_role' in ('hr','admin'));

create policy "Progress readable to HR"
on public.progress
for select
to authenticated
using (auth.jwt() ?->> 'user_role' in ('hr','admin'));

-- Typically progress is updated by the learner or the system; allow appropriate writes as needed.
create policy "Progress upsert by HR"
on public.progress
for all
to authenticated
using (auth.jwt() ?->> 'user_role' in ('hr','admin'))
with check (auth.jwt() ?->> 'user_role' in ('hr','admin'));
```

Row Level Security policies (example — adjust to your needs):

```sql
alter table public.employees enable row level security;
alter table public.lessons enable row level security;

-- Example: grant full access to admins (mapped via auth.jwt() role claim or via a secure RPC if desired).
-- Simplest approach during development: authenticated users can read; only admins can write.
create policy "Employees read for authenticated"
on public.employees for select to authenticated using (true);

create policy "Employees write for admins"
on public.employees for all to authenticated
using (auth.jwt() ?->> 'user_role' = 'admin')
with check (auth.jwt() ?->> 'user_role' = 'admin');

create policy "Lessons read for authenticated"
on public.lessons for select to authenticated using (true);

create policy "Lessons write for admins"
on public.lessons for all to authenticated
using (auth.jwt() ?->> 'user_role' = 'admin')
with check (auth.jwt() ?->> 'user_role' = 'admin');
```

Note: Ensure your auth JWT includes an appropriate claim (e.g., user_role) or use Supabase Edge Functions/Policies tied to `profiles.role` to gate writes to admins only. Other roles can be read-only or no access as desired.

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
