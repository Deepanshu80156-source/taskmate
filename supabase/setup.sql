-- ============================================================
-- TaskMate — Complete Supabase Setup
-- ============================================================
-- Run this entire file ONCE in the Supabase SQL Editor.
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- This script creates:
--   • All tables (with indexes and constraints)
--   • Row Level Security (RLS) policies for every table
--   • Storage buckets (notes & library) with access policies
--   • The reset_student_password() RPC function
--   • An auto-confirm trigger so students can log in immediately
--   • Realtime publication for live messaging
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- HELPER FUNCTIONS (used inside RLS policies)
-- These let policies look up the current user's teacher/class
-- without a slow per-row subquery.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_teacher_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_class()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class FROM profiles WHERE id = auth.uid()
$$;


-- ============================================================
-- TABLES
-- ============================================================

-- -----------------------------------------------------------------
-- profiles — stores both teachers and students
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  username      TEXT        NOT NULL UNIQUE,
  role          TEXT        NOT NULL CHECK (role IN ('teacher', 'student')),
  class         TEXT,
  roll_number   TEXT,
  guardian_name  TEXT,
  guardian_phone TEXT,
  teacher_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  photo_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_teacher_id_idx ON profiles(teacher_id);
CREATE INDEX IF NOT EXISTS profiles_username_idx   ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx       ON profiles(role);

-- -----------------------------------------------------------------
-- notes — study material uploaded by teachers
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class        TEXT        NOT NULL,
  subject      TEXT        NOT NULL,
  chapter      TEXT        NOT NULL,
  filename     TEXT        NOT NULL,
  description  TEXT,
  storage_path TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_teacher_id_idx ON notes(teacher_id);
CREATE INDEX IF NOT EXISTS notes_class_idx      ON notes(class);

-- -----------------------------------------------------------------
-- results — exam marks published by teachers
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_name       TEXT        NOT NULL,
  subject         TEXT        NOT NULL,
  marks_obtained  NUMERIC     NOT NULL,
  total_marks     NUMERIC     NOT NULL,
  remarks         TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS results_teacher_id_idx ON results(teacher_id);
CREATE INDEX IF NOT EXISTS results_student_id_idx ON results(student_id);

-- -----------------------------------------------------------------
-- announcements
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  class_scope TEXT        NOT NULL DEFAULT 'All Classes',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_teacher_id_idx ON announcements(teacher_id);

-- -----------------------------------------------------------------
-- library — teacher's permanent resource repository
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject      TEXT        NOT NULL,
  chapter      TEXT        NOT NULL,
  filename     TEXT        NOT NULL,
  description  TEXT,
  storage_path TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_teacher_id_idx ON library(teacher_id);

-- -----------------------------------------------------------------
-- activity_log — auto-recorded teacher actions
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN (
                'student_registered', 'notes_uploaded', 'result_published',
                'announcement_posted', 'message_sent'
              )),
  description TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_teacher_id_idx ON activity_log(teacher_id);

-- -----------------------------------------------------------------
-- conversations — one row per teacher–student pair
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS conversations_teacher_id_idx ON conversations(teacher_id);
CREATE INDEX IF NOT EXISTS conversations_student_id_idx ON conversations(student_id);

-- -----------------------------------------------------------------
-- messages — individual chat messages
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx      ON messages(created_at);

-- -----------------------------------------------------------------
-- notifications — per-student push notifications
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('notes', 'result', 'announcement', 'message')),
  message    TEXT        NOT NULL,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_student_id_idx ON notifications(student_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx     ON notifications(student_id, read)
  WHERE read = false;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE library       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────
-- Any user can see their own profile
CREATE POLICY "profiles: view own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Teachers can see all of their students
CREATE POLICY "profiles: teacher views students"
  ON profiles FOR SELECT
  USING (role = 'student' AND teacher_id = auth.uid());

-- You can only create a profile for yourself
CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- You can update your own profile
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Teachers can update their students' profiles
CREATE POLICY "profiles: teacher updates students"
  ON profiles FOR UPDATE
  USING (role = 'student' AND teacher_id = auth.uid());

-- Teachers can delete their own students
CREATE POLICY "profiles: teacher deletes students"
  ON profiles FOR DELETE
  USING (role = 'student' AND teacher_id = auth.uid());

-- ── notes ────────────────────────────────────────────────────
-- Teachers have full control over their own notes
CREATE POLICY "notes: teacher full access"
  ON notes FOR ALL
  USING (teacher_id = auth.uid());

-- Students can read notes that their teacher published for their class
CREATE POLICY "notes: student reads class notes"
  ON notes FOR SELECT
  USING (
    teacher_id = get_my_teacher_id()
    AND class   = get_my_class()
  );

-- ── results ──────────────────────────────────────────────────
CREATE POLICY "results: teacher full access"
  ON results FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "results: student reads own results"
  ON results FOR SELECT
  USING (student_id = auth.uid());

-- ── announcements ────────────────────────────────────────────
CREATE POLICY "announcements: teacher full access"
  ON announcements FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "announcements: student reads teacher announcements"
  ON announcements FOR SELECT
  USING (teacher_id = get_my_teacher_id());

-- ── library ──────────────────────────────────────────────────
-- Library is teacher-only (students access notes, not library directly)
CREATE POLICY "library: teacher full access"
  ON library FOR ALL
  USING (teacher_id = auth.uid());

-- ── activity_log ─────────────────────────────────────────────
CREATE POLICY "activity_log: teacher full access"
  ON activity_log FOR ALL
  USING (teacher_id = auth.uid());

-- ── conversations ────────────────────────────────────────────
CREATE POLICY "conversations: participants can view"
  ON conversations FOR SELECT
  USING (teacher_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "conversations: participants can create"
  ON conversations FOR INSERT
  WITH CHECK (teacher_id = auth.uid() OR student_id = auth.uid());

-- ── messages ─────────────────────────────────────────────────
CREATE POLICY "messages: participants can view"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

CREATE POLICY "messages: participants can send"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

-- ── notifications ────────────────────────────────────────────
CREATE POLICY "notifications: student views own"
  ON notifications FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "notifications: student marks read"
  ON notifications FOR UPDATE
  USING (student_id = auth.uid());

-- Teachers can insert notifications for their own students
CREATE POLICY "notifications: teacher inserts for students"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = student_id
        AND teacher_id = auth.uid()
    )
  );


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('notes',   'notes',   false, 52428800, ARRAY['application/pdf','image/png','image/jpeg','image/jpg']),
  ('library', 'library', false, 52428800, ARRAY['application/pdf','image/png','image/jpeg','image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- ── storage policies: notes bucket ───────────────────────────

-- Teachers upload under their own user-id folder: notes/<teacher-id>/...
CREATE POLICY "storage notes: teacher can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Teachers can read/download their own files
CREATE POLICY "storage notes: teacher can read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can read notes whose first path segment is their teacher's id
CREATE POLICY "storage notes: student reads teacher files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notes'
    AND (storage.foldername(name))[1] = get_my_teacher_id()::text
  );

-- Teachers can delete their own files
CREATE POLICY "storage notes: teacher can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── storage policies: library bucket ─────────────────────────

CREATE POLICY "storage library: teacher can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'library'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage library: teacher can read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'library'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage library: teacher can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'library'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- RPC: reset_student_password
-- Called by a teacher to reset one of their student's passwords.
-- Uses SECURITY DEFINER so it can write to auth.users safely.
-- ============================================================

CREATE OR REPLACE FUNCTION reset_student_password(
  student_id   UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: caller must be an authenticated teacher who owns this student
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id         = student_id
      AND role       = 'student'
      AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: student not found or does not belong to you';
  END IF;

  -- Validate minimum length (mirrors the app-level check)
  IF length(new_password) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;

  -- Update the hashed password directly in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at         = now()
  WHERE id = student_id;
END;
$$;

-- Grant execution only to authenticated users
REVOKE ALL ON FUNCTION reset_student_password(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reset_student_password(UUID, TEXT) TO authenticated;


-- ============================================================
-- TRIGGER: auto-confirm @taskmate.app accounts
-- ============================================================
-- Students are registered by teachers with fake @taskmate.app
-- addresses. Without this, Supabase would require email
-- confirmation and the student could never log in.
-- This trigger auto-confirms any account with that domain
-- immediately on signup, without sending any email.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_taskmate_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NEW.email LIKE '%@taskmate.app' THEN
    NEW.email_confirmed_at = now();
    NEW.updated_at         = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_taskmate_users ON auth.users;
CREATE TRIGGER auto_confirm_taskmate_users
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_taskmate_signup();


-- ============================================================
-- REALTIME — enable live messaging & notifications
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ============================================================
-- Done! Your TaskMate database is fully configured.
-- Next: copy VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- from Supabase → Settings → API into your Vercel environment.
-- ============================================================
