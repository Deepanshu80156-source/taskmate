# TaskMate release notes

## Included in this package

- Reproducible npm installation with `package-lock.json`
- Explicit dependency versions
- TypeScript included as a development dependency
- Supabase repair migration in `supabase/20260821_taskmate_repairs.sql`
- Rebuilt PWA assets and Capacitor Android web assets
- No `.env.local`, credentials, Git metadata, or `node_modules`

## First run

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the existing TaskMate project.
3. Run:

   ```bash
   npm ci
   npm run typecheck
   npm run build
   npx cap sync android
   ```

The repair migration has already been applied to the connected TaskMate
Supabase project. Do not run the older TaskMate SQL files on that project.

## Data safety

The repair migration does not delete profiles, Auth users, results, messages,
notes, announcements, library records, or Storage objects. It changes database
triggers, RLS policies, helper functions, and profile path references only.
Existing avatar objects are not removed.

## Final smoke test

After starting the app, test one teacher account and one student account:

- create a student and reset the student's password;
- check avatars in the class, leaderboard, and profile views;
- delete one test result and one test message;
- upload and display a new avatar;
- install/reinstall the PWA or Android build to refresh its icon.