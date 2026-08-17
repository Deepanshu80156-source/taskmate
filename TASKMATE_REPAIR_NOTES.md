# TaskMate repair package

This folder is based on the newer TaskMate upload. Existing application behavior
was preserved; the repair focuses on the reported failures:

- Student creation now preserves the teacher session, detects duplicate Auth
  identities, and treats a retry after a network timeout as safe.
- The final SQL creates teacher profiles inside the Supabase Auth signup
  transaction, so teacher registration works with email confirmation enabled.
- Guardian name and phone are carried through registration, teacher loading,
  editing, and CSV/ID-card views.
- Avatar paths from legacy public/signed/authenticated URL formats are
  normalized and signed from the private `avatars` bucket. Stale signed URLs
  are ignored and failed image loads can retry.
- Upload ownership is derived from the signed-in teacher instead of trusting
  caller-supplied teacher IDs.

## Supabase setup

Run **only** this file in the existing Supabase project's SQL Editor:

```text
supabase/taskmate_supabase_final.sql
```

It is designed to be rerunnable and does not delete existing profiles, Auth
users, Storage objects, notes, results, messages, announcements, or library
records. It creates/updates policies, helper functions, storage buckets, and
the safe registration RPC.

Do not run the older SQL files alongside it. Keep the existing `.env.local`
values unchanged; the frontend only needs:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Verify locally

```bash
npm ci
npm run typecheck
npm run build
```

The production build and typecheck were completed successfully for this
package.

## Android

`android/` is a standard Capacitor Android wrapper around the built PWA. The
included `TaskMate-fixed-debug.apk` is a debug-signed APK for direct testing.
It is not a Play Store release artifact. For a release build, open the
`android/` folder in Android Studio, configure your own signing key, and build
the signed release variant.

To regenerate the wrapper after changing the web app:

```bash
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
