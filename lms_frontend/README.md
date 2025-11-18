# LMS Frontend (React) — Ocean Professional

A minimal LMS frontend scaffolded with routing, Ocean Professional theme, and Supabase authentication.

## Features
- Routing with react-router: `/`, `/courses`, `/courses/:id`, `/profile` (protected), `/login`
- Ocean Professional theme (modern, subtle shadows, rounded corners, gradients)
- Supabase auth wiring (email/password), session-aware layout
- Placeholder pages: Home, Courses (search/filter UI), Course Details, Profile, Login
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

## Supabase Notes
This app initializes Supabase using environment variables only (no secrets in code). For email/password auth to work, ensure:
- Email/password auth is enabled in your Supabase project
- If you implement magic links in the future, use your deployment URL from environment (e.g., `REACT_APP_FRONTEND_URL`) for redirects

Key files:
- `src/lib/supabaseClient.js` — Supabase client
- `src/lib/auth.js` — Auth helpers (signIn, signOut, getSession), AuthProvider/useAuth, ProtectedRoute

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
  pages/
    CourseDetailsPage.js
    CoursesPage.js
    HomePage.js
    LoginPage.js
    ProfilePage.js
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
- No secrets are hardcoded; environment-only configuration
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
