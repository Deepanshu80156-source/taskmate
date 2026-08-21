-- ============================================================
-- TaskMate — consolidated Supabase schema and security definition
-- ============================================================
-- This is the single source of truth for a fresh project and for reruns.
-- It is safe to run more than once and will not delete application data.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Helper functions used in RLS
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_class()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  username       TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  class          TEXT,
  roll_number    TEXT,
  guardian_name  TEXT,
  guardian_phone TEXT,
  teacher_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  photo_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bring older installations up to the current profile shape without
-- replacing or deleting existing rows.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_teacher_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_teacher_id_idx ON public.profiles(teacher_id);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_teacher_class_role_idx
  ON public.profiles (teacher_id, class, role);

-- ------------------------------------------------------------
-- Core application tables
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  chapter      TEXT NOT NULL,
  filename     TEXT NOT NULL,
  description  TEXT,
  storage_path TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_teacher_id_idx ON public.notes(teacher_id);
CREATE INDEX IF NOT EXISTS notes_class_idx ON public.notes(class);

CREATE TABLE IF NOT EXISTS public.results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_name      TEXT NOT NULL,
  subject        TEXT NOT NULL,
  marks_obtained NUMERIC NOT NULL,
  total_marks    NUMERIC NOT NULL,
  remarks        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS results_teacher_id_idx ON public.results(teacher_id);
CREATE INDEX IF NOT EXISTS results_student_id_idx ON public.results(student_id);
CREATE INDEX IF NOT EXISTS results_teacher_student_subject_created_idx
  ON public.results (teacher_id, student_id, subject, created_at DESC);

CREATE TABLE IF NOT EXISTS public.announcements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  content             TEXT NOT NULL,
  class_scope         TEXT NOT NULL DEFAULT 'All Classes',
  attachment_path     TEXT,
  attachment_name     TEXT,
  attachment_mime_type TEXT,
  attachment_size     BIGINT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

CREATE INDEX IF NOT EXISTS announcements_teacher_id_idx ON public.announcements(teacher_id);
CREATE INDEX IF NOT EXISTS announcements_teacher_scope_created_idx
  ON public.announcements (teacher_id, class_scope, created_at DESC);

CREATE TABLE IF NOT EXISTS public.library (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  chapter      TEXT NOT NULL,
  filename     TEXT NOT NULL,
  description  TEXT,
  storage_path TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_teacher_id_idx ON public.library(teacher_id);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
    'student_registered',
    'notes_uploaded',
    'result_published',
    'announcement_posted',
    'message_sent',
    'password_reset'
  )),
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_teacher_id_idx ON public.activity_log(teacher_id);

-- Older databases may still have the pre-password-reset activity check.
ALTER TABLE public.activity_log
  DROP CONSTRAINT IF EXISTS activity_log_type_check;
ALTER TABLE public.activity_log
  ADD CONSTRAINT activity_log_type_check CHECK (
    type IN (
      'student_registered',
      'notes_uploaded',
      'result_published',
      'announcement_posted',
      'message_sent',
      'password_reset'
    )
  );

CREATE TABLE IF NOT EXISTS public.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS conversations_teacher_id_idx ON public.conversations(teacher_id);
CREATE INDEX IF NOT EXISTS conversations_student_id_idx ON public.conversations(student_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text                TEXT NOT NULL,
  attachment_path     TEXT,
  attachment_name     TEXT,
  attachment_mime_type TEXT,
  attachment_size     BIGINT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('notes', 'result', 'announcement', 'message')),
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_student_id_idx ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications(student_id, read)
  WHERE read = false;

-- ------------------------------------------------------------
-- RLS enablement
-- ------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Profile policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "profiles:view own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: view own" ON public.profiles;
CREATE POLICY "profiles:view own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles:teacher views assigned students" ON public.profiles;
DROP POLICY IF EXISTS "profiles: teacher views students" ON public.profiles;
CREATE POLICY "profiles:teacher views assigned students"
  ON public.profiles FOR SELECT
  USING (role = 'student' AND teacher_id = auth.uid());

DROP POLICY IF EXISTS "profiles:student views self and teacher and classmates" ON public.profiles;
DROP POLICY IF EXISTS "profiles: student views classmates" ON public.profiles;
CREATE POLICY "profiles:student views self and teacher and classmates"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR (
      role = 'teacher'
      AND id = get_my_teacher_id()
    )
    OR (
      role = 'student'
      AND teacher_id = get_my_teacher_id()
      AND class = get_my_class()
    )
  );

DROP POLICY IF EXISTS "profiles:insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
CREATE POLICY "profiles:insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles:update own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles:update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles:teacher updates assigned students" ON public.profiles;
DROP POLICY IF EXISTS "profiles: teacher updates students" ON public.profiles;
CREATE POLICY "profiles:teacher updates assigned students"
  ON public.profiles FOR UPDATE
  USING (role = 'student' AND teacher_id = auth.uid())
  WITH CHECK (role = 'student' AND teacher_id = auth.uid());

DROP POLICY IF EXISTS "profiles:teacher deletes assigned students" ON public.profiles;
DROP POLICY IF EXISTS "profiles: teacher deletes students" ON public.profiles;
CREATE POLICY "profiles:teacher deletes assigned students"
  ON public.profiles FOR DELETE
  USING (role = 'student' AND teacher_id = auth.uid());

-- Prevent identity or authorization fields from being changed by clients.
-- OLD/NEW are trigger row values; they are not valid names inside an RLS
-- policy expression. The previous version used OLD here and could stop the
-- script before the storage policies and RPCs were created.
DROP POLICY IF EXISTS "profiles:identity protected" ON public.profiles;
CREATE OR REPLACE FUNCTION public.protect_profile_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.username IS DISTINCT FROM OLD.username
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN
    RAISE EXCEPTION 'Profile identity fields cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_identity_fields ON public.profiles;
CREATE TRIGGER protect_profile_identity_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_identity();

-- ------------------------------------------------------------
-- Notes policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "notes:teacher full access" ON public.notes;
CREATE POLICY "notes:teacher full access"
  ON public.notes FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "notes:student reads assigned class notes" ON public.notes;
CREATE POLICY "notes:student reads assigned class notes"
  ON public.notes FOR SELECT
  USING (
    teacher_id = get_my_teacher_id()
    AND class = get_my_class()
  );

-- ------------------------------------------------------------
-- Result policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "results:teacher full access" ON public.results;
CREATE POLICY "results:teacher full access"
  ON public.results FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "results:student reads own results" ON public.results;
CREATE POLICY "results:student reads own results"
  ON public.results FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "results:student reads class results" ON public.results;
CREATE POLICY "results:student reads class results"
  ON public.results FOR SELECT
  USING (
    teacher_id = get_my_teacher_id()
    AND EXISTS (
      SELECT 1
      FROM public.profiles student_profile
      WHERE student_profile.id = results.student_id
        AND student_profile.role = 'student'
        AND student_profile.teacher_id = get_my_teacher_id()
        AND student_profile.class = get_my_class()
    )
  );

-- ------------------------------------------------------------
-- Announcement policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "announcements:teacher full access" ON public.announcements;
CREATE POLICY "announcements:teacher full access"
  ON public.announcements FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "announcements:student reads assigned teacher announcements" ON public.announcements;
CREATE POLICY "announcements:student reads assigned teacher announcements"
  ON public.announcements FOR SELECT
  USING (
    teacher_id = get_my_teacher_id()
    AND (class_scope = 'All Classes' OR class_scope = get_my_class())
  );

-- ------------------------------------------------------------
-- Library policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "library:teacher full access" ON public.library;
CREATE POLICY "library:teacher full access"
  ON public.library FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "library:student reads assigned teacher files" ON public.library;
CREATE POLICY "library:student reads assigned teacher files"
  ON public.library FOR SELECT
  USING (teacher_id = get_my_teacher_id());

-- ------------------------------------------------------------
-- Activity log policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "activity_log:teacher full access" ON public.activity_log;
CREATE POLICY "activity_log:teacher full access"
  ON public.activity_log FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ------------------------------------------------------------
-- Conversations and messages policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "conversations:participants can view" ON public.conversations;
CREATE POLICY "conversations:participants can view"
  ON public.conversations FOR SELECT
  USING (teacher_id = auth.uid() OR student_id = auth.uid());

DROP POLICY IF EXISTS "conversations:participants can create" ON public.conversations;
CREATE POLICY "conversations:participants can create"
  ON public.conversations FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    OR student_id = auth.uid()
  );

DROP POLICY IF EXISTS "messages:participants can view" ON public.messages;
CREATE POLICY "messages:participants can view"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages:participants can send" ON public.messages;
CREATE POLICY "messages:participants can send"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- Notifications policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "notifications:student views own" ON public.notifications;
CREATE POLICY "notifications:student views own"
  ON public.notifications FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "notifications:student marks read" ON public.notifications;
CREATE POLICY "notifications:student marks read"
  ON public.notifications FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "notifications:teacher inserts for students" ON public.notifications;
CREATE POLICY "notifications:teacher inserts for students"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = student_id
        AND p.teacher_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Storage buckets (private only)
-- ------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('notes', 'notes', false, 52428800, ARRAY['application/pdf','image/png','image/jpeg','image/jpg']),
  ('library', 'library', false, 52428800, ARRAY['application/pdf','image/png','image/jpeg','image/jpg']),
  ('announcements', 'announcements', false, 10485760, ARRAY['application/pdf','image/png','image/jpeg','image/jpg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', false, 2097152, ARRAY['image/png','image/jpeg','image/jpg']),
  ('message_files', 'message_files', false, 20971520, ARRAY['image/png','image/jpeg','image/jpg','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Repair bucket settings on older installations as well as fresh ones.
UPDATE storage.buckets
SET public = false,
    file_size_limit = CASE id
      WHEN 'notes' THEN 52428800
      WHEN 'library' THEN 52428800
      WHEN 'announcements' THEN 10485760
      WHEN 'avatars' THEN 2097152
      WHEN 'message_files' THEN 20971520
      ELSE file_size_limit
    END,
    allowed_mime_types = CASE id
      WHEN 'notes' THEN ARRAY['application/pdf','image/png','image/jpeg','image/jpg']
      WHEN 'library' THEN ARRAY['application/pdf','image/png','image/jpeg','image/jpg']
      WHEN 'announcements' THEN ARRAY['application/pdf','image/png','image/jpeg','image/jpg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      WHEN 'avatars' THEN ARRAY['image/png','image/jpeg','image/jpg']
      WHEN 'message_files' THEN ARRAY['image/png','image/jpeg','image/jpg','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      ELSE allowed_mime_types
    END
WHERE id IN ('notes', 'library', 'announcements', 'avatars', 'message_files');

-- Notes bucket
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

-- Library bucket
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
  USING (bucket_id = 'library' AND (storage.foldername(name))[1] = get_my_teacher_id()::text);

DROP POLICY IF EXISTS "storage library: teacher can delete" ON storage.objects;
CREATE POLICY "storage library: teacher can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Announcements bucket
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

-- Avatar bucket: private and restricted to owner + teacher/class visibility.
DROP POLICY IF EXISTS "storage avatars: user can upload own" ON storage.objects;
CREATE POLICY "storage avatars: user can upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage avatars: permitted users can read" ON storage.objects;
CREATE POLICY "storage avatars: permitted users can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1
        FROM public.profiles target_profile
        WHERE target_profile.id::text = (storage.foldername(name))[1]
          AND (
            target_profile.id = get_my_teacher_id()
            OR target_profile.teacher_id = auth.uid()
            OR (
              target_profile.role = 'student'
              AND target_profile.teacher_id = get_my_teacher_id()
              AND target_profile.class = get_my_class()
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS "storage avatars: user can delete own" ON storage.objects;
CREATE POLICY "storage avatars: user can delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Message attachment bucket
DROP POLICY IF EXISTS "storage message_files: sender can upload" ON storage.objects;
CREATE POLICY "storage message_files: sender can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message_files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage message_files: conversation participants can read" ON storage.objects;
CREATE POLICY "storage message_files: conversation participants can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message_files'
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.attachment_path = name
        AND EXISTS (
          SELECT 1
          FROM public.conversations c
          WHERE c.id = m.conversation_id
            AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "storage message_files: sender can delete" ON storage.objects;
CREATE POLICY "storage message_files: sender can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'message_files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ------------------------------------------------------------
-- Password reset RPC
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reset_student_password(
  student_id UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = student_id
      AND role = 'student'
      AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: student not found or does not belong to you';
  END IF;

  IF length(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_student_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_student_password(UUID, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- Secure student profile creation RPC used by the browser
-- ------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_student_profile(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
);

CREATE FUNCTION public.create_student_profile(
  p_student_id UUID,
  p_name TEXT,
  p_username TEXT,
  p_class TEXT,
  p_roll_number TEXT DEFAULT NULL,
  p_guardian_name TEXT DEFAULT NULL,
  p_guardian_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID;
BEGIN
  v_teacher_id := auth.uid();

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_teacher_id
      AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Only an authenticated teacher can create student profiles';
  END IF;

  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'Student id is required';
  END IF;

  IF NULLIF(trim(p_name), '') IS NULL
     OR NULLIF(lower(trim(p_username)), '') IS NULL
     OR NULLIF(trim(p_class), '') IS NULL THEN
    RAISE EXCEPTION 'Student name, username, and class are required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_student_id
  ) THEN
    -- A retry after a network timeout is safe. Only the same teacher may
    -- complete the same student profile; never overwrite another account.
    IF EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = p_student_id
        AND role = 'student'
        AND teacher_id = v_teacher_id
    ) THEN
      UPDATE public.profiles
      SET name = trim(p_name),
          username = lower(trim(p_username)),
          class = trim(p_class),
          roll_number = NULLIF(trim(COALESCE(p_roll_number, '')), ''),
          guardian_name = NULLIF(trim(COALESCE(p_guardian_name, '')), ''),
          guardian_phone = NULLIF(trim(COALESCE(p_guardian_phone, '')), '')
      WHERE id = p_student_id;
      RETURN p_student_id;
    END IF;

    RAISE EXCEPTION 'A profile already exists for this student ID';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(username) = lower(trim(p_username))
  ) THEN
    RAISE EXCEPTION 'This username is already taken';
  END IF;

  INSERT INTO public.profiles (
    id,
    name,
    username,
    role,
    class,
    roll_number,
    guardian_name,
    guardian_phone,
    teacher_id
  )
  VALUES (
    p_student_id,
    trim(p_name),
    lower(trim(p_username)),
    'student',
    trim(p_class),
    NULLIF(trim(COALESCE(p_roll_number, '')), ''),
    NULLIF(trim(COALESCE(p_guardian_name, '')), ''),
    NULLIF(trim(COALESCE(p_guardian_phone, '')), ''),
    v_teacher_id
  );

  RETURN p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_student_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_student_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- Auto-confirm taskmate.app accounts
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_taskmate_signup()
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
  EXECUTE FUNCTION public.handle_taskmate_signup();

-- Create teacher profiles from signup metadata. This runs in the database
-- transaction, so teacher registration also works when email confirmation is
-- enabled and the browser has no authenticated session yet.
CREATE OR REPLACE FUNCTION public.handle_taskmate_teacher_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_username TEXT;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', '') <> 'teacher' THEN
    RETURN NEW;
  END IF;

  v_name := NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), '');
  v_username := NULLIF(lower(trim(NEW.raw_user_meta_data ->> 'username')), '');

  IF v_name IS NULL OR v_username IS NULL THEN
    RAISE EXCEPTION 'Teacher name and username are required';
  END IF;

  INSERT INTO public.profiles (id, name, username, role)
  VALUES (NEW.id, v_name, v_username, 'teacher')
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        username = EXCLUDED.username,
        role = 'teacher';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_taskmate_teacher_profile ON auth.users;
CREATE TRIGGER create_taskmate_teacher_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_taskmate_teacher_profile();

-- ------------------------------------------------------------
-- Realtime publication setup (safe rerun)
-- ------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ------------------------------------------------------------
-- Legacy avatar normalization helper
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_avatar_path(raw_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  value_text TEXT;
  normalized TEXT;
  clean_path TEXT;
BEGIN
  IF raw_value IS NULL THEN
    RETURN NULL;
  END IF;

  value_text := trim(raw_value);
  IF value_text = '' THEN
    RETURN NULL;
  END IF;

  IF value_text LIKE 'http://%' OR value_text LIKE 'https://%' THEN
    normalized := regexp_replace(value_text, '^https?://[^/]+', '', 'i');
    IF normalized LIKE '/storage/v1/object/public/avatars/%' THEN
      clean_path := trim(substring(normalized from '/storage/v1/object/public/avatars/(.*)'));
      RETURN NULLIF(regexp_replace(clean_path, '\?.*$', ''), '');
    ELSIF normalized LIKE '/storage/v1/object/sign/avatars/%' THEN
      clean_path := trim(substring(normalized from '/storage/v1/object/sign/avatars/(.*)'));
      RETURN NULLIF(regexp_replace(clean_path, '\?.*$', ''), '');
    END IF;
    RETURN NULL;
  END IF;

  normalized := regexp_replace(value_text, '^/+|/+$', '', 'g');
  normalized := regexp_replace(normalized, '^avatars/', '', 'i');
  normalized := regexp_replace(normalized, '\?.*$', '', 'g');

  IF normalized = '' THEN
    RETURN NULL;
  END IF;

  RETURN normalized;
END;
$$;

-- Append a compatibility update to profile rows when a legacy avatar URL is clearly a Supabase object URL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'photo_url'
  ) THEN
    UPDATE public.profiles
    SET photo_url = public.normalize_avatar_path(photo_url)
    WHERE photo_url IS NOT NULL
      AND (
        photo_url LIKE 'avatars/%'
        OR photo_url LIKE '%/storage/v1/object/public/avatars/%'
        OR photo_url LIKE '%/storage/v1/object/sign/avatars/%'
      );
  END IF;
END $$;
