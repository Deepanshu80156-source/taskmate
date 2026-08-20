# TaskMate update verification

## Repaired in this update

- Student registration now retries the idempotent `create_student_profile`
  Supabase RPC once after a short network interruption.
- A retry reuses the already-created Auth user ID instead of creating a second
  Auth account.
- Guardian name and phone are selected from Supabase, mapped into the app
  model, saved during registration, preserved during edits, and shown in the
  student directory, ID card, CSV export, and student profile.
- Supabase schema files include the guardian columns and the secure
  `create_student_profile` RPC.
- Anonymous access to `SECURITY DEFINER` RPCs was revoked, while the
  authenticated operations used by the application remain available.

## Verified locally

From the folder containing `package.json`:

```bash
npm ci
npm run typecheck
npm run build
```

All three commands completed successfully on August 20, 2026. Vite reports
only a bundle-size warning; it does not prevent deployment.

## Required Supabase step

Before testing student registration in production, run the SQL files listed in
`FINAL_SETUP_GUIDE.md` in the existing TaskMate Supabase project. The browser
code cannot create the secure profile RPC by itself.