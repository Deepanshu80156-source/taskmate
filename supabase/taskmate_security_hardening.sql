-- TaskMate security hardening applied after the main schema migrations.
-- Prevents unauthenticated RPC calls to SECURITY DEFINER functions while
-- preserving the authenticated operations used by the application.

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn.signature);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.create_student_profile(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.reset_student_password(UUID, TEXT)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.approve_teacher_account(UUID)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.deny_teacher_account(UUID)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.normalize_avatar_path(raw_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
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