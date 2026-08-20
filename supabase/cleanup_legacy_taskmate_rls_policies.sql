-- TaskMate legacy RLS cleanup
-- Safe to rerun. Removes only obsolete duplicate policy names.
DROP POLICY IF EXISTS "activity_log: teacher full access" ON public.activity_log;
DROP POLICY IF EXISTS "announcements: student reads teacher announcements" ON public.announcements;
DROP POLICY IF EXISTS "announcements: teacher full access" ON public.announcements;
DROP POLICY IF EXISTS "conversations: participants can create" ON public.conversations;
DROP POLICY IF EXISTS "conversations: participants can view" ON public.conversations;
DROP POLICY IF EXISTS "library: student reads teacher files" ON public.library;
DROP POLICY IF EXISTS "library: teacher full access" ON public.library;
DROP POLICY IF EXISTS "messages: participants can send" ON public.messages;
DROP POLICY IF EXISTS "messages: participants can view" ON public.messages;
DROP POLICY IF EXISTS "notes: student reads class notes" ON public.notes;
DROP POLICY IF EXISTS "notes: teacher full access" ON public.notes;
DROP POLICY IF EXISTS "notifications: student marks read" ON public.notifications;
DROP POLICY IF EXISTS "notifications: student views own" ON public.notifications;
DROP POLICY IF EXISTS "notifications: teacher inserts for students" ON public.notifications;
DROP POLICY IF EXISTS "profiles: student views assigned teacher" ON public.profiles;
DROP POLICY IF EXISTS "results: student reads class results" ON public.results;
DROP POLICY IF EXISTS "results: student reads own results" ON public.results;
DROP POLICY IF EXISTS "results: teacher full access" ON public.results;
