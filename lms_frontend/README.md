# LMS Frontend (React) — Ocean Professional

A minimal LMS frontend with routing, Ocean Professional theme, Supabase authentication, and RLS-backed role-based access control (RBAC).

## Features
- Routing with react-router: `/`, `/courses`, `/courses/:id`, `/profile` (protected), `/auth/login`
- RBAC with Supabase (RLS-backed from `public.user_roles`): `/admin` (admin only), `/hr` (hr and admin)
- Ocean Professional theme (primary #2563EB, amber accents #F59E0B), subtle shadows, rounded corners
- Supabase auth wiring (email/password), session-aware layout and role-aware navigation
- Contextual header links: HR/Admin links appear only if user has those roles
- Role-specific sign-in shortcuts in header and home page: "Admin Sign In", "HR Sign In", "Employee Sign In"
- Placeholder pages: Home, Courses, Course Details, Profile
- Dashboards: AdminDashboard and HRDashboard
- Error Boundary and toast notifications
- API client placeholder reading `REACT_APP_API_BASE`

New in this update:
- Admin: Quick-create Lesson form on Admin Dashboard with Supabase Storage uploads (PDF/Video) or external link, resources array, and metadata persisted to lessons table.
- HR: Assign-by-email form and Performance snapshot embedded in HR Dashboard, using Supabase tables (assignments, progress).
- Employee: Self dashboard at /employee showing assigned lessons grouped by course, progress bar, and actions to update progress.
- Admin: Seed Demo Data utility to populate courses, lessons, assignments (and optional progress) in Supabase with idempotent UPSERTs.

Note: The legacy "Categories" sidebar and "Browse Courses" call-to-action on Home have been removed to simplify navigation.

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

## Demo Data Seeding (Admin-only)

An Admin-only Seed Demo Data panel is available under Admin Dashboard. It inserts sample courses, lessons, and assignments and is safe to run multiple times (idempotent UPSERT by stable keys).

- Location: Admin Dashboard -> "Seed Demo Data"
- Inputs:
  - Optional comma-separated user emails to target for assignments (e.g., `admin@demo.com, hr@demo.com, employee@demo.com`)
  - Optional "Seed example progress" checkbox
- Behavior:
  - Courses are upserted by unique `code`
  - Lessons are upserted by unique `lesson_key`
  - Assignments are upserted by unique `assignment_key`
  - Optional `progress` rows are upserted by unique `progress_key`
  - If emails are omitted, the tool attempts to discover users in a demo domain (%.demo.com) from a `profiles` or `users` table
- Output:
  - Clear toast and inline panel feedback including counts and any warnings/errors
  - Console logs for further details

If tables are missing or RLS prevents inserts, the UI will show helpful messages and links to `README_RLS_TROUBLESHOOTING.md`.

### Expected Schema (Simplified)

This utility expects the following tables or compatible views/columns:
- `courses` with at least: `id (uuid/int)`, `code (text unique)`, `title`, `description`, timestamps
- `lessons` with at least: `lesson_key (text unique)`, `course_code (text)`, `title`, `type (pdf|video|link)`, `link_url`, `asset_url`, `order_index`, timestamps
- `assignments` with at least: `assignment_key (text unique)`, `user_email (text)`, `course_code (text)`, `title`, `status`, `due_date`, timestamps
- `progress` (optional) with: `progress_key (text unique)`, `user_email (text)`, `lesson_key (text)`, `status`, `completed_at`, timestamps
- A user directory table, typically `profiles` or `users` with `email` field, used to resolve IDs if your schema needs `user_id`

If your schema uses foreign keys by `id`, the seeding tool attempts to look up IDs after upserting courses and will include `course_id` and `user_id` where possible. If your schema uses `code/email` directly, the insert remains compatible.

### Troubleshooting Seeding

- If you see missing table errors or permission denied (RLS), visit:
  - `README_RLS_TROUBLESHOOTING.md` for guidance on enabling insert privileges during development
- Verify the schema in your Supabase project matches the expected columns above (or adapt the seed utility code to your schema names/columns).
- Ensure authenticated session has rights to perform UPSERT operations.

## Sign-in and Roles

- Sign-in only; signup is disabled. The UI presents three dedicated sign-in buttons:
  - Admin Sign In → `/auth/login?role=admin`
  - HR Sign In → `/auth/login?role=hr`
  - Employee Sign In → `/auth/login?role=employee`
- The login page reads `?role=` and updates its title/subtext accordingly, but authentication remains email/password via Supabase.
- The `/auth/signup` path is disabled and redirects to `/auth/login` (any provided query params are preserved).

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

## Admin: Quick-create Lesson

Admin Dashboard now includes a "Create Lesson" form with:
- Fields: courseId, title, description, contentType [pdf|video|link], optional resources (comma-separated URLs)
- Uploads: PDF/Video upload to Supabase Storage bucket: `lesson-assets`
- Persists to table: `public.lessons` with columns:
  - id uuid default gen_random_uuid()
  - course_id text/uuid
  - title text
  - description text
  - type text
  - asset_url text
  - link_url text
  - resources text[] (optional)
  - created_by uuid (auth.users.id)
  - created_at timestamptz default now()

If upload or insert fails due to missing bucket/table or RLS, the UI shows a clear error and this README contains required SQL.

## HR: Assign by Email and Performance Snapshot

HR Dashboard includes:
- Assign by Email:
  - Inputs: employee email, courseId, lesson (select)
  - Resolves user id via `employees(user_id,email)` if available
  - Inserts into `public.assignments`:
    - id uuid default gen_random_uuid()
    - assignee_user_id uuid
    - course_id text/uuid
    - lesson_id uuid
    - assigned_by uuid
    - assigned_at timestamptz default now()
    - status text default 'pending'
- Performance snapshot:
  - Reads recent progress from `public.progress` with filters by status
  - Shows average completion percent

## Supabase SQL (Buckets, Tables, Policies)

Run the following SQL in your Supabase project's SQL editor to provision required schema (adjust types to your preference: uuid/text).

-- Bucket
-- Create Storage bucket 'lesson-assets' and make it public (or add RLS policies for read as needed)
-- In Dashboard → Storage: create bucket 'lesson-assets' (public)
-- Or via SQL (if using supabase CLI, requires service role):
-- select storage.create_bucket('lesson-assets', public => true);

-- Tables
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  title text not null,
  description text,
  type text check (type in ('pdf','video','link')) not null,
  asset_url text,
  link_url text,
  resources text[],
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  assignee_user_id uuid not null,
  course_id text,
  lesson_id uuid,
  assigned_by uuid,
  assigned_at timestamptz default now(),
  status text default 'pending'
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id text,
  lesson_id uuid,
  completion_pct numeric default 0,
  last_accessed timestamptz default now()
);

-- Optional mapping table used by HR email assignment helper:
-- stores employee->auth user mapping to resolve emails
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text unique,
  name text,
  department text,
  role text,
  status text,
  created_at timestamptz default now()
);

-- RLS
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.assignments enable row level security;
alter table public.progress enable row level security;
alter table public.employees enable row level security;
alter table public.user_roles enable row level security;

-- Basic policies (example, adapt for your org's rules)

-- Authenticated users can read lessons
create policy if not exists lessons_read
on public.lessons for select
to authenticated
using (true);

-- Admins can insert lessons (example role check expects user_roles)
create policy if not exists lessons_insert_admin
on public.lessons for insert
to authenticated
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));

-- Authenticated read assignments
create policy if not exists assignments_read
on public.assignments for select
to authenticated
using (true);

-- HR/Admin can insert assignments
create policy if not exists assignments_insert_hr_admin
on public.assignments for insert
to authenticated
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('hr','admin')));

-- Authenticated read progress
create policy if not exists progress_read
on public.progress for select
to authenticated
using (true);

-- Learners upsert own progress (example)
create policy if not exists progress_upsert_self
on public.progress for insert
to authenticated
with check (user_id = auth.uid());

create policy if not exists progress_update_self
on public.progress for update
to authenticated
using (user_id = auth.uid());

-- Employees table read for HR/Admin
create policy if not exists employees_read_hr_admin
on public.employees for select
to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('hr','admin')));

-- user_roles read own rows
create policy if not exists user_roles_self
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

-- Employee Dashboard RLS examples (adjust to your schema)
-- If assignments has employee_id referencing auth.users.id:
create policy if not exists assignments_employee_select_self
on public.assignments for select
to authenticated
using (employee_id = auth.uid());

-- If progress links to assignments by assignment_id:
create policy if not exists progress_select_self
on public.progress for select
to authenticated
using (exists (select 1 from public.assignments a where a.id = assignment_id and a.employee_id = auth.uid()));

create policy if not exists progress_upsert_self_by_assignment
on public.progress for insert
to authenticated
with check (exists (select 1 from public.assignments a where a.id = assignment_id and a.employee_id = auth.uid()));

create policy if not exists progress_update_self_by_assignment
on public.progress for update
to authenticated
using (exists (select 1 from public.assignments a where a.id = assignment_id and a.employee_id = auth.uid()))
with check (exists (select 1 from public.assignments a where a.id = assignment_id and a.employee_id = auth.uid()));

-- Indexes recommended
create unique index if not exists progress_assignment_id_unique on public.progress(assignment_id);
create index if not exists assignments_employee_idx on public.assignments(employee_id);

-- Optional: Storage public read (handled by bucket 'public' setting).
-- If bucket isn't public, add storage policies (requires SQL via storage.objects).

## Troubleshooting

- Storage upload fails with "bucket not found":
  - Create Storage bucket named `lesson-assets` (public) in Supabase.
- Insert blocked with RLS error:
  - Apply the SQL policies above and ensure your user has role rows in `public.user_roles`.
- Assign by email can't resolve user:
  - Ensure `public.employees` contains a row with `email` and `user_id` pointing to the auth.users id.

## Key Files
- `src/lib/supabaseClient.js` — Supabase client
- `src/lib/services/supabaseHelpers.js` — Storage upload helper, schema hints, and email→user id resolver
- `src/lib/services/seeding.js` — Demo data seeding utility (idempotent UPSERTs)
- `src/pages/admin/AdminDashboard.js` — Lesson quick-create form with uploads and Seed panel
- `src/pages/hr/HRDashboard.js` — Assign-by-email and performance snapshot

## Security
- No secrets are hardcoded; environment-only configuration using:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_KEY`
- No sensitive data is logged
- Client-side input validation on forms
- RLS must be configured server-side; client shows friendly guidance if blocked.

## Scripts
- `npm start` — start development server
- `npm build` — build production bundle
- `npm test` — run tests

```diff
Important:
- Ensure .env is not committed.
- Provide valid Supabase URL and anon/public key.
- Ensure user RLS policies allow reading own rows from public.user_roles.
- Create Storage bucket 'lesson-assets' and run provided table/policy SQL.
- Use Admin Dashboard → Seed Demo Data to populate sample content safely (idempotent).
```
