-- TaskMate targeted repair migration.
-- Safe to run after any earlier TaskMate schema/security migration.

-- Student profiles are created only through the checked teacher RPC.
-- The old INSERT trigger rejected that legitimate SECURITY DEFINER path.
DROP TRIGGER IF EXISTS profiles_identity_guard ON public.profiles;
DROP TRIGGER IF EXISTS prevent_profile_identity_changes ON public.profiles;

DROP POLICY IF EXISTS "profiles:insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
CREATE POLICY "profiles:insert own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role = 'teacher'
    AND teacher_id IS NULL
  );

-- pgcrypto is installed in the extensions schema on the live project.
CREATE OR REPLACE FUNCTION public.reset_student_password(
  student_id UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = student_id AND role = 'student' AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: student not found or does not belong to you';
  END IF;
  IF length(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = student_id;
END;
$$;
REVOKE ALL ON FUNCTION public.reset_student_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_student_password(UUID, TEXT) TO authenticated;

-- Teacher-only deletion of assigned results.
DROP POLICY IF EXISTS "results:teacher full access" ON public.results;
CREATE POLICY "results:teacher full access"
  ON public.results FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Teachers may delete messages in their own conversations; students retain
-- read/send access but cannot erase conversation history.
DROP POLICY IF EXISTS "messages:teacher can delete" ON public.messages;
CREATE POLICY "messages:teacher can delete"
  ON public.messages FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.teacher_id = auth.uid()
    )
  );

-- Avatar paths support both legacy <profile-id>/file and canonical
-- avatars/<profile-id>/file objects while the client standardizes new uploads.
CREATE OR REPLACE FUNCTION public.avatar_profile_id(object_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN (storage.foldername(object_name))[1] = 'avatars'
      THEN (storage.foldername(object_name))[2]
    ELSE (storage.foldername(object_name))[1]
  END
$$;

DROP POLICY IF EXISTS "storage avatars: user can upload own" ON storage.objects;
CREATE POLICY "storage avatars: user can upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND public.avatar_profile_id(name) = auth.uid()::text);

DROP POLICY IF EXISTS "storage avatars: permitted users can read" ON storage.objects;
CREATE POLICY "storage avatars: permitted users can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      public.avatar_profile_id(name) = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles target_profile
        WHERE target_profile.id::text = public.avatar_profile_id(name)
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
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND public.avatar_profile_id(name) = auth.uid()::text);

-- Canonicalize stored profile references without touching external URLs.
UPDATE public.profiles
SET photo_url = 'avatars/' || regexp_replace(trim(photo_url), '^avatars/', '', 'i')
WHERE photo_url IS NOT NULL
  AND trim(photo_url) <> ''
  AND trim(photo_url) !~* '^https?://'
  AND trim(photo_url) !~* '^avatars/';