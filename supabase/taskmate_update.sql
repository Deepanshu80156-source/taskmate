-- TaskMate targeted update migration
-- Run this file after the original supabase/setup.sql.
-- It intentionally changes only the policies, indexes, activity constraint,
-- and password-reset function required by the updated application.

BEGIN;

-- The updated application records teacher password-reset actions separately.
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

-- Keep result visibility inside the student's own class. Teachers retain their
-- existing full-access policy and students retain access to their own results.
DROP POLICY IF EXISTS "results: student reads class results" ON public.results;
CREATE POLICY "results: student reads class results"
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

-- Apply the same class boundary to announcements. All Classes remains visible
-- to students assigned to that teacher.
DROP POLICY IF EXISTS "announcements: student reads teacher announcements" ON public.announcements;
CREATE POLICY "announcements: student reads teacher announcements"
  ON public.announcements FOR SELECT
  USING (
    teacher_id = get_my_teacher_id()
    AND (class_scope = 'All Classes' OR class_scope = get_my_class())
  );

-- Avatars remain private. A signed URL can be generated only for the owner,
-- their assigned teacher, their assigned students, or classmates in the same
-- class. This matches the people who can see those profiles in the UI.
DROP POLICY IF EXISTS "storage avatars: user can read own" ON storage.objects;
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

-- These indexes support the initial dashboard, class filtering, and message
-- hydration without changing any existing records.
CREATE INDEX IF NOT EXISTS profiles_teacher_class_role_idx
  ON public.profiles (teacher_id, class, role);

CREATE INDEX IF NOT EXISTS results_teacher_student_subject_created_idx
  ON public.results (teacher_id, student_id, subject, created_at DESC);

CREATE INDEX IF NOT EXISTS announcements_teacher_scope_created_idx
  ON public.announcements (teacher_id, class_scope, created_at DESC);

-- Keep the existing teacher-only authorization boundary and align its minimum
-- with the application password policy.
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

COMMIT;