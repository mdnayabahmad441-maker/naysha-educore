-- Safe permission-only fix for teacher attendance.
-- Run this in Supabase SQL Editor if the teacher page shows:
-- "permission denied for table teacher_attendance"

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teacher_attendance TO authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
      AND c.relname = 'teacher_attendance_id_seq'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE public.teacher_attendance_id_seq TO authenticated, service_role;
  END IF;
END $$;

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_attendance_self" ON public.teacher_attendance;
DROP POLICY IF EXISTS "teacher_attendance_admin" ON public.teacher_attendance;

CREATE POLICY "teacher_attendance_self"
  ON public.teacher_attendance
  FOR ALL
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "teacher_attendance_admin"
  ON public.teacher_attendance
  FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

NOTIFY pgrst, 'reload schema';
