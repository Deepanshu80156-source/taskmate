-- TaskMate teacher approval workflow.
-- Safe to rerun. Existing teachers are approved; new teacher signups are pending.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'denied'));

UPDATE public.profiles
SET approval_status = 'approved',
    approved_at = COALESCE(approved_at, created_at)
WHERE role = 'teacher' AND approval_status IS NULL;

CREATE TABLE IF NOT EXISTS public.teacher_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS teacher_approval_requests_status_idx
  ON public.teacher_approval_requests(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_taskmate_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher' AND username = 'deepanshu'
  );
$$;

CREATE OR REPLACE FUNCTION public.create_teacher_approval_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'teacher' AND NEW.username <> 'deepanshu'
     AND NEW.approval_status = 'pending' THEN
    INSERT INTO public.teacher_approval_requests (teacher_id, teacher_name, username)
    VALUES (NEW.id, NEW.name, NEW.username)
    ON CONFLICT (teacher_id) DO UPDATE
      SET teacher_name = EXCLUDED.teacher_name,
          username = EXCLUDED.username,
          status = 'pending',
          reviewed_at = NULL,
          reviewed_by = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_new_teacher_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'teacher' AND lower(NEW.username) <> 'deepanshu' THEN
    NEW.approval_status := 'pending';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_new_teacher_pending ON public.profiles;
CREATE TRIGGER mark_new_teacher_pending
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.mark_new_teacher_pending();

DROP TRIGGER IF EXISTS create_teacher_approval_request ON public.profiles;
CREATE TRIGGER create_teacher_approval_request
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_teacher_approval_request();

ALTER TABLE public.teacher_approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval requests: admin views all" ON public.teacher_approval_requests;
CREATE POLICY "approval requests: admin views all"
  ON public.teacher_approval_requests FOR SELECT
  USING (public.is_taskmate_admin() OR teacher_id = auth.uid());

DROP POLICY IF EXISTS "approval requests: admin updates" ON public.teacher_approval_requests;
CREATE POLICY "approval requests: admin updates"
  ON public.teacher_approval_requests FOR UPDATE
  USING (public.is_taskmate_admin())
  WITH CHECK (public.is_taskmate_admin());

CREATE OR REPLACE FUNCTION public.approve_teacher_account(p_teacher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_taskmate_admin() THEN
    RAISE EXCEPTION 'Only the administrator can approve teachers';
  END IF;
  UPDATE public.profiles
  SET approval_status = 'approved', approved_by = auth.uid(), approved_at = now()
  WHERE id = p_teacher_id AND role = 'teacher';
  UPDATE public.teacher_approval_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE teacher_id = p_teacher_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.deny_teacher_account(p_teacher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_taskmate_admin() THEN
    RAISE EXCEPTION 'Only the administrator can deny teachers';
  END IF;
  UPDATE public.profiles
  SET approval_status = 'denied', approved_by = auth.uid(), approved_at = now()
  WHERE id = p_teacher_id AND role = 'teacher';
  UPDATE public.teacher_approval_requests
  SET status = 'denied', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE teacher_id = p_teacher_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_teacher_account(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deny_teacher_account(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_teacher_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deny_teacher_account(UUID) TO authenticated;