# Role-based Access Troubleshooting (Supabase)

If you cannot access /admin or /hr after successful login:

1) Confirm environment variables:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

2) Ensure a role row exists for your user:
Table: public.user_roles
Columns: user_id (uuid), role (text: 'admin' | 'hr' | 'learner')

Insert example (SQL):
INSERT INTO public.user_roles (user_id, role)
VALUES ('<your-auth-user-id>', 'admin');

3) Verify Row Level Security (RLS) policies:
Enable RLS on public.user_roles and add a SELECT policy that allows an authenticated user to read their own rows.

Example policy (Supabase SQL editor):
-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own roles
CREATE POLICY "Allow users to read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Restrict insert/update/delete to admins or service role as per your needs.

4) Expected behavior:
- After login, the app fetches roles via SELECT role FROM public.user_roles WHERE user_id = auth.uid().
- If roles include 'admin', you will be redirected to /admin.
- If roles include 'hr', you will be redirected to /hr.
- Otherwise you remain a 'learner' and cannot access /admin or /hr.

5) Debugging:
- Open browser devtools console and review logs starting with [Auth], [roles], or [RouteGuard].
- If you see warnings stating "No roles returned. If you expect roles, check RLS/policies...", your user likely lacks a visible row in user_roles or the policy prevents SELECT.

## Seeding Demo Data

If the Admin Dashboard "Seed Demo Data" operation fails with messages like "permission denied" or "RLS prevented inserting into X", temporarily adjust your RLS policies to allow the authenticated role used by the frontend to `insert` and `upsert` on these tables:

- courses
- lessons
- assignments
- progress (if you enable progress seeding)

During development, you can create permissive policies or a dev-only service role for seeding. Revert to least-privilege policies afterward.

Also ensure your schema or views expose a user directory table (`profiles` or `users`) with an `email` field for email-based assignment targeting. If not available, provide explicit emails in the seed form, or adapt the seeding code to match your schema.

Security note: Do not expose service keys in the frontend. Use the anon key only.
