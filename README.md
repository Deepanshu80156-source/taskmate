# TaskMate – Student Portal

A modern, full-featured student management portal for tuition classes. Manage notes, results, announcements, messages, and more—all in one place.

**Status:** ✅ Repaired and build-verified

## Included repair

This version includes the non-destructive registration, visibility, and avatar repair:

- Teachers request the complete profile row for their assigned students, including guardian details.
- Legacy Supabase public, signed, and authenticated avatar URLs are converted into storage paths and re-signed at display time.
- Avatar loading ignores stale in-flight responses when a profile changes.
- Student account creation preserves the teacher session, detects duplicate Auth identities, and is safe to retry after a timeout.
- Teacher signup creates the profile inside the Supabase Auth transaction, including when email confirmation is enabled.
- `supabase/taskmate_supabase_final.sql` is the single rerunnable, non-destructive SQL file for existing projects.

The deliverable intentionally does not include `.env.local` or Git metadata. Keep your existing local environment file unchanged and copy the source files into that project folder.

## Final setup checklist

1. Extract this folder and keep your existing `.env.local` beside `package.json`.
2. Run `npm ci`, then `npm run typecheck` and `npm run build`.
3. In the existing Supabase project, run only `supabase/taskmate_supabase_final.sql`.
4. Test teacher signup, student registration/login, profile photos, notes, results, announcements, library, messages, and notifications before pushing the repaired folder.

---

## Features

- 📚 **Digital Library** – Upload and organize class notes
- 📊 **Results Management** – Track and view exam/assignment results
- 📢 **Announcements** – Real-time class updates and notices
- 💬 **Messaging** – Direct communication between students and teachers
- 🏆 **Leaderboard** – View class performance rankings
- 👤 **Student Profiles** – Manage personal information and settings
- 🎨 **Dark Mode** – Beautiful, modern UI with theme support
- 📱 **Responsive Design** – Optimized for desktop, tablet, and mobile
- ⚡ **Progressive Web App** – Install as an app on your device
- 🔐 **Secure Authentication** – Built with Supabase

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **State Management:** React Context + React Query
- **Deployment:** Vercel (recommended)

---

## Prerequisites

Before you begin, ensure you have:
- [Node.js 18+](https://nodejs.org)
- [Git](https://git-scm.com)
- A free [Supabase](https://supabase.com) account

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/taskmate.git
cd taskmate
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these values:**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project
3. Go to **Settings** → **API** → Copy the values

⚠️ **Never commit `.env.local` to Git** — it's already in `.gitignore`

### 4. Set Up the Database

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query and paste the contents of `supabase/taskmate_supabase_final.sql`
3. Run the query to create all tables and seed data

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm preview

# Type check (without emitting)
npm run typecheck
```

---

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Radix UI wrappers
│   └── layout/       # Layout components (AppShell, Sidebar)
├── pages/            # Page components (organized by role)
│   ├── student/      # Student pages (Dashboard, Notes, Results, etc.)
│   └── teacher/      # Teacher pages (Students, Upload, etc.)
├── context/          # React Context (Auth, Theme)
├── services/         # API calls & data fetching
├── lib/              # Utilities (Supabase client, helpers)
├── hooks/            # Custom React hooks
├── data/             # Constants and mock data
└── App.tsx           # Main app component with routing
```

---

## User Roles

### Student
- View class announcements
- Access uploaded notes and library
- Check exam/assignment results
- View class leaderboard
- Manage profile and settings
- Send/receive messages with teacher

### Teacher
- Upload and manage class notes
- Upload student results
- Post announcements
- Manage registered students
- Send/receive class messages
- View class performance

---

## Authentication

The app uses **Supabase Authentication** with role-based access:

- **Login:** Username + Password
- **Student Registration:** Teachers create accounts for students
- **Password Management:** Users can change their passwords
- **Session Persistence:** Automatic login on page reload

---

## Deployment to Vercel

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Start:**
1. Push your code to GitHub
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized, minified code ready for deployment.

---

## Troubleshooting

### "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
- Check that `.env.local` exists in the root directory
- Verify the keys are correct in Supabase dashboard
- Restart the dev server after creating `.env.local`

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Build fails with chunk size warning
This is a warning, not an error. The build succeeds. Consider code-splitting for better performance.

### Changes not reflecting in browser
- Clear browser cache (Ctrl+Shift+Delete)
- Restart the dev server
- Check browser console for errors

---

## Performance Notes

- The app uses Vite for fast development and optimized production builds
- React Query handles caching and data synchronization
- Progressive Web App (PWA) support for offline functionality and app installation
- Tree-shaking and code-splitting reduce bundle size

---

## Security

- ✅ Environment variables never exposed
- ✅ Supabase handles authentication and database security
- ✅ Row-level security (RLS) enforced at database level
- ✅ No hardcoded secrets in source code
- ✅ HTTPS required for production

---

## Contributing

This is a personal tuition management project. For bugs or improvements:
1. Create an issue describing the problem
2. Submit a pull request with your changes
3. Ensure all tests pass and code follows the existing style

---

## License

This project is provided as-is for educational purposes.

---

## Support & Questions

Refer to the [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed setup instructions or check the [Supabase Documentation](https://supabase.com/docs).

---

**Made with ❤️ for students and teachers.**
