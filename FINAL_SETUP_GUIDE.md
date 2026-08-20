# TaskMate final setup guide

The database workflow is already applied to the connected TaskMate Supabase project. This ZIP contains the matching frontend source and the SQL files used for the repair.

## What changed

- Deleted the four confirmed teacher accounts: `dnc.wtf`, `avinashbaazigar`, `nottodie`, and `iamavinash`.
- Preserved the `deepanshu` teacher account and all existing student data.
- Added teacher approval status: existing teachers stay approved; new teachers become pending.
- Added the administrator approval screen at `/teacher/approvals`.
- Only the teacher with username `deepanshu` can see the approval screen and approve/deny requests.
- New teachers receive a pending message and cannot sign in until approved.
- Added a new green TaskMate mark to the landing page, login page, sidebar, favicon, and PWA metadata assets.
- Kept profile photos, student password reset, notes, results, announcements, library, messaging, notifications, and existing features.
- No Replit-specific package or runtime dependency was added.

## Fresh install / local run

1. Extract `taskmate-completed.zip`.
2. Open the extracted `TaskMate-completed` folder.
3. Copy your old `.env.local` file into this exact folder, beside `package.json`.
4. Open `.env.local` and verify these two values still point to the TaskMate Supabase project:

   ```env
   VITE_SUPABASE_URL=https://msqoarwvznbyvzdwmaau.supabase.co
   VITE_SUPABASE_ANON_KEY=your-existing-anon-key
   ```

5. Open a terminal in the folder containing `package.json`.
6. Install the exact locked dependencies:

   ```bash
   npm ci
   ```

7. Check for TypeScript errors:

   ```bash
   npm run typecheck
   ```

8. Create the production build:

   ```bash
   npm run build
   ```

9. Start the application:

   ```bash
   npm run dev
   ```

10. Open the local URL printed by Vite, normally `http://localhost:5173`.

## If setting up another Supabase project

Run the SQL files in this order from Supabase Dashboard → SQL Editor:

1. Open `supabase/cleanup_legacy_taskmate_rls_policies.sql`, paste it into a new SQL query, and click **Run**.
2. Open `supabase/taskmate_supabase_final.sql`, paste it into a new SQL query, and click **Run**.
3. Open `supabase/teacher_approval_workflow.sql`, paste it into a new SQL query, and click **Run**.
4. Open `supabase/taskmate_security_hardening.sql`, paste it into a new SQL query, and click **Run**.

Do not run old TaskMate SQL files after these files.

## First administrator test

1. Log in through **Teacher Login** with username `deepanshu`.
2. Confirm the existing students and notes appear.
3. Open **Teacher Approvals** from the sidebar.
4. In a private/incognito browser, create a new teacher account.
5. Confirm the new account displays “Authentication pending”.
6. Return to the `deepanshu` session, open **Teacher Approvals**, and click **Allow**.
7. Log in with the new teacher account and confirm access works.
8. Repeat with another test account and click **Deny**. Confirm it cannot log in.

## Feature checklist

- [ ] Teacher login as `deepanshu`
- [ ] Student login
- [ ] New teacher pending registration
- [ ] Admin allow/deny
- [ ] Student registration
- [ ] Teacher changes student password
- [ ] Student and teacher profile photos
- [ ] Notes upload and download
- [ ] Results upload and display
- [ ] Announcements and attachments
- [ ] Library upload and download
- [ ] Teacher/student messaging and attachments
- [ ] Notifications
- [ ] Leaderboards
- [ ] Dark mode
- [ ] Mobile/PWA layout