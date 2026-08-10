-- ============================================================
-- TaskMate — Complete Supabase Setup
-- ============================================================
-- Run this entire file ONCE in the Supabase SQL Editor.
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLES
-- ============================================================

-- profiles — stores both teachers and students
-- (must be created before the helper functions below)
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  username       TEXT        NOT NULL UNIQUE,
  role           TEXT        NOT NULL CHECK (role IN ('teacher', 'student')),
  class          TEXT,
  roll_number    TEXT,
  guardian_name  TEXT,
  guardian_phone TEXT,
  teacher_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  photo_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_teacher_id_idx ON profiles(teacher_id);
CREATE INDEX IF NOT EXISTS profiles_username_idx   ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx       ON profiles(role);


-- ============================================================
-- HELPER FUNCTIONS (used inside RLS policies)
-- Defined AFTER profiles so PostgreSQL can validate the table
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


-- notes — study material uploaded by teachers
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


-- results — exam marks published by teachers
CREATE TABLE IF NOT EXISTS results (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_name      TEXT        NOT NULL,
  subject        TEXT        NOT NULL,
  marks_obtained NUMERIC     NOT NULL,
  total_marks    NUMERIC     NOT NULL,
  remarks        TEXT        DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS results_teacher_id_idx ON results(teacher_id);
CREATE INDEX IF NOT EXISTS results_student_id_idx ON results(student_id);


-- announcements
CREATE TABLE IF NOT EXISTS announcements (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               TEXT        NOT NULL,
  content             TEXT        NOT NULL,
  class_scope         TEXT        NOT NULL DEFAULT 'All Classes',
  attachment_path     TEXT,
  attachment_name     TEXT,
  attachment_mime_type TEXT,
  attachment_size     BIGINT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_path TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

CREATE INDEX IF NOT EXISTS announcements_teacher_id_idx ON announcements(teacher_id);


-- library — teacher's permanent resource repository
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


-- activity_log — auto-recorded teacher actions
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


-- conversations — one row per teacher–student pair
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS conversations_teacher_id_idx ON conversations(teacher_id);
CREATE INDEX IF NOT EXISTS conversations_student_id_idx ON conversations(student_id);


-- messages — individual chat messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx      ON messages(created_at);


-- notifications — per-student notifications
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

-- profiles
DROP POLICY IF EXISTS "profiles: view own" ON profiles;
CREATE POLICY "profiles: view own"
  ON profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles: teacher views students" ON profiles;
CREATE POLICY "profiles: teacher views students"
  ON profiles FOR SELECT USING (role = 'student' AND teacher_id = auth.uid());

DROP POLICY IF EXISTS "profiles: student views classmates" ON profiles;
CREATE POLICY "profiles: student views classmates"
  ON profiles FOR SELECT
  USING (
    role = 'student'
    AND teacher_id = get_my_teacher_id()
    AND class = get_my_class()
  );

DROP POLICY IF EXISTS "profiles: insert own" ON profiles;
CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles: update own" ON profiles;
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles: teacher updates students" ON profiles;
CREATE POLICY "profiles: teacher updates students"
  ON profiles FOR UPDATE USING (role = 'student' AND teacher_id = auth.uid());

DROP POLICY IF EXISTS "profiles: teacher deletes students" ON profiles;
CREATE POLICY "profiles: teacher deletes students"
  ON profiles FOR DELETE USING (role = 'student' AND teacher_id = auth.uid());

-- notes
DROP POLICY IF EXISTS "notes: teacher full access" ON notes;
CREATE POLICY "notes: teacher full access"
  ON notes FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "notes: student reads class notes" ON notes;
CREATE POLICY "notes: student reads class notes"
  ON notes FOR SELECT
  USING (teacher_id = get_my_teacher_id() AND class = get_my_class());

-- results
DROP POLICY IF EXISTS "results: teacher full access" ON results;
CREATE POLICY "results: teacher full access"
  ON results FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "results: student reads own results" ON results;
CREATE POLICY "results: student reads own results"
  ON results FOR SELECT USING (student_id = auth.uid());

-- announcements
DROP POLICY IF EXISTS "announcements: teacher full access" ON announcements;
CREATE POLICY "announcements: teacher full access"
  ON announcements FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "announcements: student reads teacher announcements" ON announcements;
CREATE POLICY "announcements: student reads teacher announcements"
  ON announcements FOR SELECT USING (teacher_id = get_my_teacher_id());

-- library
DROP POLICY IF EXISTS "library: teacher full access" ON library;
CREATE POLICY "library: teacher full access"
  ON library FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "library: student reads teacher files" ON library;
CREATE POLICY "library: student reads teacher files"
  ON library FOR SELECT
  USING (
    teacher_id = get_my_teacher_id()
  );

-- activity_log
DROP POLICY IF EXISTS "activity_log: teacher full access" ON activity_log;
CREATE POLICY "activity_log: teacher full access"
  ON activity_log FOR ALL USING (teacher_id = auth.uid());

-- conversations
DROP POLICY IF EXISTS "conversations: participants can view" ON conversations;
CREATE POLICY "conversations: participants can view"
  ON conversations FOR SELECT
  USING (teacher_id = auth.uid() OR student_id = auth.uid());

DROP POLICY IF EXISTS "conversations: participants can create" ON conversations;
CREATE POLICY "conversations: participants can create"
  ON conversations FOR INSERT
  WITH CHECK (teacher_id = auth.uid() OR student_id = auth.uid());

-- messages
DROP POLICY IF EXISTS "messages: participants can view" ON messages;
CREATE POLICY "messages: participants can view"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages: participants can send" ON messages;
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

-- notifications
DROP POLICY IF EXISTS "notifications: student views own" ON notifications;
CREATE POLICY "notifications: student views own"
  ON notifications FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "notifications: student marks read" ON notifications;
CREATE POLICY "notifications: student marks read"
  ON notifications FOR UPDATE USING (student_id = auth.uid());

DROP POLICY IF EXISTS "notifications: teacher inserts for students" ON notifications;
CREATE POLICY "notifications: teacher inserts for students"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = student_id AND teacher_id = auth.uid()
    )
  );


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('notes',         'notes',         false, 52428800, ARRAY['application/pdf','image/png','image/jpeg','image/jpg']),
  ('library',       'library',       false, 52428800, ARRAY['application/pdf','image/png','image/jpeg','image/jpg']),
  ('announcements', 'announcements', false, 10485760, ARRAY['application/pdf','image/png','image/jpeg','image/jpg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars',       'avatars',       false, 2097152, ARRAY['image/png','image/jpeg','image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- notes bucket
DROP POLICY IF EXISTS "storage notes: teacher can upload" ON storage.objects;
CREATE POLICY "storage notes: teacher can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage notes: teacher can read own" ON storage.objects;
CREATE POLICY "storage notes: teacher can read own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage notes: student reads teacher files" ON storage.objects;
CREATE POLICY "storage notes: student reads teacher files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes' AND (storage.foldername(name))[1] = get_my_teacher_id()::text);

DROP POLICY IF EXISTS "storage notes: teacher can delete" ON storage.objects;
CREATE POLICY "storage notes: teacher can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- library bucket
DROP POLICY IF EXISTS "storage library: teacher can upload" ON storage.objects;
CREATE POLICY "storage library: teacher can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage library: teacher can read own" ON storage.objects;
CREATE POLICY "storage library: teacher can read own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage library: student reads teacher files" ON storage.objects;
CREATE POLICY "storage library: student reads teacher files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'library'
    AND (storage.foldername(name))[1] = get_my_teacher_id()::text
  );

DROP POLICY IF EXISTS "storage library: teacher can delete" ON storage.objects;
CREATE POLICY "storage library: teacher can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- announcements bucket
DROP POLICY IF EXISTS "storage announcements: teacher can upload" ON storage.objects;
CREATE POLICY "storage announcements: teacher can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'announcements' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage announcements: teacher can read own" ON storage.objects;
CREATE POLICY "storage announcements: teacher can read own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcements' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage announcements: student reads teacher files" ON storage.objects;
CREATE POLICY "storage announcements: student reads teacher files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcements' AND (storage.foldername(name))[1] = get_my_teacher_id()::text);

DROP POLICY IF EXISTS "storage announcements: teacher can delete" ON storage.objects;
CREATE POLICY "storage announcements: teacher can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'announcements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars bucket
DROP POLICY IF EXISTS "storage avatars: user can upload own" ON storage.objects;
CREATE POLICY "storage avatars: user can upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage avatars: user can read own" ON storage.objects;
CREATE POLICY "storage avatars: user can read own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage avatars: user can delete own" ON storage.objects;
CREATE POLICY "storage avatars: user can delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- RPC: reset_student_password
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
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = student_id AND role = 'student' AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: student not found or does not belong to you';
  END IF;

  IF length(new_password) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = student_id;
END;
$$;

REVOKE ALL ON FUNCTION reset_student_password(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reset_student_password(UUID, TEXT) TO authenticated;


-- ============================================================
-- TRIGGER: auto-confirm @taskmate.app accounts
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
    NEW.updated_at = now();
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
-- REALTIME
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;