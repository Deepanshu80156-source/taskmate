# TaskMate — Deployment Guide
### Git → Supabase → Vercel

Follow these steps in order. The whole process takes about 15–20 minutes.

---

## Prerequisites

- A free [GitHub](https://github.com) account
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account
- [Node.js 18+](https://nodejs.org) installed on your computer
- [Git](https://git-scm.com) installed on your computer

---

## Step 1 — Push Your Code to GitHub

1. **Open a terminal** and navigate to this project folder:
   ```bash
   cd taskmate   # the folder containing package.json
   ```

2. **Initialize Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit – TaskMate v1"
   ```

3. **Create a new repository on GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Name it `taskmate` (or anything you like)
   - Set it to **Private** (recommended — your student data is sensitive)
   - Do **not** add a README, .gitignore, or license (you already have these)
   - Click **Create repository**

4. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/taskmate.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Fill in:
   - **Name:** `taskmate`
   - **Database Password:** Choose a strong password and **save it somewhere safe**.
   - **Region:** Pick the region closest to your users.
4. Click **Create new project** and wait ~2 minutes for it to set up.

---

## Step 3 — Run the Database Setup SQL

This single SQL file creates every table, policy, storage bucket, and function your app needs.

1. In your Supabase project, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `supabase/setup.sql` from this project and copy its entire contents.
4. Paste it into the SQL Editor.
5. Click **Run** (or press `Ctrl + Enter`).

You should see: `Success. No rows returned.`

> **If you see an error** like "already exists", it's safe to ignore — it just means the table/policy is already there. Re-running the SQL is safe.

---

## Step 4 — Copy Your Supabase Credentials

1. In Supabase, go to **Settings → API** (left sidebar).
2. You need two values:
   - **Project URL** (looks like `https://xxxxxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)
3. Keep this page open — you'll need these values in Step 6.

---

## Step 5 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Click **Import Git Repository** and connect your GitHub account if you haven't already.
4. Find and select your `taskmate` repository.
5. Vercel will auto-detect it as a **Vite** project.
   - **Framework Preset:** Vite
   - **Root Directory:** leave it as `.` (the default)
   - **Build Command:** `npm run build` (Vercel detects this automatically)
   - **Output Directory:** `dist`
6. **Do NOT click Deploy yet.** You need to add environment variables first (next step).

---

## Step 6 — Add Environment Variables in Vercel

Still on the Vercel import page, scroll down to **Environment Variables**.

Add the following two variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL from Step 4 |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key from Step 4 |

> **Important:** Both variables must start with `VITE_` — that's how Vite exposes them to the frontend build. Without them, the app will not start.

Now click **Deploy**.

---

## Step 7 — Verify the Deployment

1. Vercel will build and deploy in about 1–2 minutes.
2. Once done, click **Visit** to open your live app.
3. You should see the TaskMate landing page.
4. Create a teacher account and test logging in.
5. Register a student and verify they can log in with the credentials you set.

---

## After Deployment — Making Updates

Every time you make changes to the code:

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel automatically detects the push and redeploys within 1–2 minutes. No manual steps needed.

---

## Troubleshooting

### "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
You forgot to add the environment variables in Vercel. Go to:
Vercel → Your Project → Settings → Environment Variables → Add both variables → Redeploy.

### Student can't log in after registration
The auto-confirm trigger in `setup.sql` handles this automatically.
If it still fails, go to **Supabase → Authentication → Settings** and turn off **"Enable email confirmations"**.

### "Failed to reset password" error
This means the `reset_student_password` SQL function wasn't created. Re-run the `supabase/setup.sql` file in the Supabase SQL Editor.

### File uploads (notes/library) are failing
Make sure the storage buckets were created. Go to **Supabase → Storage** and confirm you see `notes` and `library` buckets. If not, re-run the SQL setup.

### App looks broken after a code change
Run `npm run build` locally first to catch TypeScript/build errors before pushing:
```bash
npm run build
```

### "New Row violates Row Level Security policy"
This is a Supabase security error. It usually means:
- A student is trying to write data they don't own (expected — it's a security feature working correctly).
- OR a teacher is accessing data from another teacher (also expected).
- If you see it for normal operations, check that you ran the full `setup.sql` including the RLS policy section.

---

## Security Notes

- **Never expose your `service_role` key** in the frontend. Only the `anon` key is safe to use in client-side code.
- **Student passwords** are stored as secure bcrypt hashes in Supabase — the plain-text password is only shown once at registration time and is never stored anywhere.
- **Deleting a student** from the Students page removes their profile data but leaves their Supabase Auth account. This is a known limitation of client-side Supabase. To fully delete a user's auth record, go to **Supabase → Authentication → Users** and delete them manually. (This can be automated later with a Supabase Edge Function.)

---

## Project Structure (for reference)

```
taskmate/
├── src/
│   ├── context/AuthContext.tsx   ← All data logic and Supabase calls
│   ├── lib/supabase.ts           ← Supabase client initialization
│   ├── pages/
│   │   ├── teacher/              ← Teacher portal pages
│   │   └── student/              ← Student portal pages
│   ├── data/mockData.ts          ← TypeScript type definitions
│   └── data/constants.ts         ← CLASS_LIST and shared constants
├── supabase/
│   └── setup.sql                 ← Run this once in Supabase SQL Editor
├── public/                       ← Icons, PWA manifest
├── .env.example                  ← Environment variable template
├── DEPLOYMENT.md                 ← This file
├── package.json
└── vite.config.ts
```
