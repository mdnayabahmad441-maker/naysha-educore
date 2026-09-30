-- ==============================================================================
-- NAYSHA EDUCORE — PHASE 3B EMERGENCY SECURITY & RLS HARDENING MIGRATION
-- Migration: 20260929_security_rls_hardening.sql
-- Project: xrgwvppbcnnqguduxgeg
-- 
-- DESCRIPTION:
--   1. Fixes critical credential leak on school_whatsapp (blocks anon access completely).
--   2. Enables Row-Level Security (RLS) & FORCE RLS across all operational tables.
--   3. Implements non-recursive SECURITY DEFINER helper functions for tenant/role scoping.
--   4. Enforces strict parent-child ownership boundaries.
--   5. Preserves public features (school subdomain routing & admission inquiries).
--   6. Exposes secure catalog diagnostic RPCs for Phase 3B live verification.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. SECURE DIAGNOSTIC FUNCTIONS FOR LIVE RLS AUDIT (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_table_security()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  rls_forced boolean,
  policy_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT 
    c.relname::text AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    count(p.polname) AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
  ORDER BY c.relname;
$$;

CREATE OR REPLACE FUNCTION public.get_table_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT 
    schemaname::text,
    tablename::text,
    policyname::text,
    permissive::text,
    roles::text[],
    cmd::text,
    qual::text,
    with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
$$;

GRANT EXECUTE ON FUNCTION public.check_table_security() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_table_policies() TO authenticated, service_role;


-- 3. SECURE AUTH HELPER FUNCTIONS (SECURITY DEFINER with fixed search_path)
CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_student_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id
  FROM public.parents
  WHERE auth_id = auth.uid()
     OR email = (SELECT email FROM auth.users WHERE id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.current_user_school_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_student_ids() TO authenticated, service_role;


-- ==============================================================================
-- PRIORITY 1 & 2: LOCK DOWN school_whatsapp (Meta OAuth Credentials)
-- ==============================================================================
ALTER TABLE public.school_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_whatsapp FORCE ROW LEVEL SECURITY;

-- Block anon from any direct access
REVOKE ALL ON TABLE public.school_whatsapp FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.school_whatsapp TO authenticated, service_role;

DROP POLICY IF EXISTS "school_whatsapp_deny_anon" ON public.school_whatsapp;
DROP POLICY IF EXISTS "school_whatsapp_admin_select" ON public.school_whatsapp;
DROP POLICY IF EXISTS "school_whatsapp_admin_read" ON public.school_whatsapp;
DROP POLICY IF EXISTS "school_whatsapp_public_read" ON public.school_whatsapp;
DROP POLICY IF EXISTS "Allow public read" ON public.school_whatsapp;

-- Only authenticated school admins may SELECT their school's metadata
CREATE POLICY "school_whatsapp_admin_select"
  ON public.school_whatsapp
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );


-- ==============================================================================
-- PRIORITY 4: LOCK DOWN CORE OPERATIONAL TABLES
-- ==============================================================================

-- Enable RLS & FORCE RLS across all operational tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'schools', 'students', 'parents', 'attendance', 'fees', 'payments',
    'marks', 'results', 'classes', 'subjects', 'teacher_classes',
    'teacher_subjects', 'exam_subjects', 'exams', 'academic_years',
    'class_fee_settings', 'settings', 'notifications', 'admission_enquiries',
    'admissions', 'profiles', 'student_enrollments', 'teachers', 'report_cards'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);
    END IF;
  END LOOP;
END $$;

-- Revoke anon access from sensitive private tables (defense-in-depth)
REVOKE ALL ON TABLE public.students FROM anon;
REVOKE ALL ON TABLE public.parents FROM anon;
REVOKE ALL ON TABLE public.fees FROM anon;
REVOKE ALL ON TABLE public.payments FROM anon;
REVOKE ALL ON TABLE public.attendance FROM anon;
REVOKE ALL ON TABLE public.marks FROM anon;
REVOKE ALL ON TABLE public.results FROM anon;
REVOKE ALL ON TABLE public.settings FROM anon;
REVOKE ALL ON TABLE public.notifications FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.students TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parents TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fees TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.attendance TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.marks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.results TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- A. SCHOOLS TABLE (Public read for tenant routing; Admin update for own school)
-- ------------------------------------------------------------------------------
GRANT SELECT ON TABLE public.schools TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "schools_public_tenant_read" ON public.schools;
CREATE POLICY "schools_public_tenant_read"
  ON public.schools
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "schools_admin_update" ON public.schools;
CREATE POLICY "schools_admin_update"
  ON public.schools
  FOR UPDATE
  TO authenticated
  USING (
    id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );


-- ------------------------------------------------------------------------------
-- B. STUDENTS TABLE (Admin manage, Teacher read own school, Parent read own child)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "students_admin_all" ON public.students;
CREATE POLICY "students_admin_all"
  ON public.students
  FOR ALL
  TO authenticated
  USING (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  )
  WITH CHECK (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "students_teacher_select" ON public.students;
CREATE POLICY "students_teacher_select"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'teacher'
  );

DROP POLICY IF EXISTS "students_parent_select" ON public.students;
CREATE POLICY "students_parent_select"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT public.current_user_student_ids())
  );


-- ------------------------------------------------------------------------------
-- C. PARENTS TABLE (Admin manage, Teacher read, Parent read own record)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "parents_admin_all" ON public.parents;
CREATE POLICY "parents_admin_all"
  ON public.parents
  FOR ALL
  TO authenticated
  USING (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  )
  WITH CHECK (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "parents_teacher_select" ON public.parents;
CREATE POLICY "parents_teacher_select"
  ON public.parents
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'teacher'
  );

DROP POLICY IF EXISTS "parents_parent_self" ON public.parents;
CREATE POLICY "parents_parent_self"
  ON public.parents
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );


-- ------------------------------------------------------------------------------
-- D. ATTENDANCE TABLE (Admin/Teacher manage, Parent read own child)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "attendance_admin_teacher_all" ON public.attendance;
CREATE POLICY "attendance_admin_teacher_all"
  ON public.attendance
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('admin', 'teacher')
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "attendance_parent_select" ON public.attendance;
CREATE POLICY "attendance_parent_select"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT public.current_user_student_ids())
  );


-- ------------------------------------------------------------------------------
-- E. FEES & PAYMENTS TABLES (Admin manage, Parent read own child)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "fees_admin_all" ON public.fees;
CREATE POLICY "fees_admin_all"
  ON public.fees
  FOR ALL
  TO authenticated
  USING (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  )
  WITH CHECK (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "fees_parent_select" ON public.fees;
CREATE POLICY "fees_parent_select"
  ON public.fees
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT public.current_user_student_ids())
  );

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  )
  WITH CHECK (
    (school_id = public.current_user_school_id() AND public.current_user_role() = 'admin')
    OR public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "payments_parent_select" ON public.payments;
CREATE POLICY "payments_parent_select"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT public.current_user_student_ids())
  );


-- ------------------------------------------------------------------------------
-- F. MARKS & RESULTS TABLES (Admin/Teacher manage, Parent read own child)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "marks_staff_all" ON public.marks;
CREATE POLICY "marks_staff_all"
  ON public.marks
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('admin', 'teacher')
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "marks_parent_select" ON public.marks;
CREATE POLICY "marks_parent_select"
  ON public.marks
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT public.current_user_student_ids())
  );

DROP POLICY IF EXISTS "results_staff_all" ON public.results;
CREATE POLICY "results_staff_all"
  ON public.results
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('admin', 'teacher')
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "results_parent_select" ON public.results;
CREATE POLICY "results_parent_select"
  ON public.results
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT public.current_user_student_ids())
  );


-- ------------------------------------------------------------------------------
-- G. CLASSES & SUBJECTS TABLES (Staff read/write within own school)
-- ------------------------------------------------------------------------------
GRANT SELECT ON TABLE public.classes TO authenticated, service_role;
GRANT SELECT ON TABLE public.subjects TO authenticated, service_role;
GRANT SELECT ON TABLE public.teacher_classes TO authenticated, service_role;
GRANT SELECT ON TABLE public.teacher_subjects TO authenticated, service_role;

DROP POLICY IF EXISTS "classes_staff_select" ON public.classes;
CREATE POLICY "classes_staff_select"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
  );

DROP POLICY IF EXISTS "classes_admin_manage" ON public.classes;
CREATE POLICY "classes_admin_manage"
  ON public.classes
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "subjects_staff_select" ON public.subjects;
CREATE POLICY "subjects_staff_select"
  ON public.subjects
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
  );

DROP POLICY IF EXISTS "subjects_admin_manage" ON public.subjects;
CREATE POLICY "subjects_admin_manage"
  ON public.subjects
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );


-- ------------------------------------------------------------------------------
-- H. ACADEMIC YEARS & SETTINGS TABLES
-- ------------------------------------------------------------------------------
GRANT SELECT ON TABLE public.academic_years TO authenticated, service_role;
GRANT SELECT ON TABLE public.class_fee_settings TO authenticated, service_role;

DROP POLICY IF EXISTS "academic_years_select" ON public.academic_years;
CREATE POLICY "academic_years_select"
  ON public.academic_years
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
  );

DROP POLICY IF EXISTS "academic_years_admin_manage" ON public.academic_years;
CREATE POLICY "academic_years_admin_manage"
  ON public.academic_years
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
  );

DROP POLICY IF EXISTS "settings_admin_manage" ON public.settings;
CREATE POLICY "settings_admin_manage"
  ON public.settings
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "class_fee_settings_select" ON public.class_fee_settings;
CREATE POLICY "class_fee_settings_select"
  ON public.class_fee_settings
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
  );

DROP POLICY IF EXISTS "class_fee_settings_admin_manage" ON public.class_fee_settings;
CREATE POLICY "class_fee_settings_admin_manage"
  ON public.class_fee_settings
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );


-- ------------------------------------------------------------------------------
-- I. ADMISSION ENQUIRIES (Public INSERT preserved; Admin manage within school)
-- ------------------------------------------------------------------------------
GRANT INSERT ON TABLE public.admission_enquiries TO anon, authenticated, service_role;
GRANT SELECT, UPDATE ON TABLE public.admission_enquiries TO authenticated, service_role;

DROP POLICY IF EXISTS "admission_enquiries_public_insert" ON public.admission_enquiries;
CREATE POLICY "admission_enquiries_public_insert"
  ON public.admission_enquiries
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "admission_enquiries_admin_select" ON public.admission_enquiries;
CREATE POLICY "admission_enquiries_admin_select"
  ON public.admission_enquiries
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "admission_enquiries_admin_update" ON public.admission_enquiries;
CREATE POLICY "admission_enquiries_admin_update"
  ON public.admission_enquiries
  FOR UPDATE
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );


-- ------------------------------------------------------------------------------
-- J. NOTIFICATIONS (Staff & parents see only their own school / targeted notifs)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND (
      public.current_user_role() IN ('admin', 'teacher')
      OR student_id IS NULL
      OR student_id IN (SELECT public.current_user_student_ids())
    )
  );

DROP POLICY IF EXISTS "notifications_admin_manage" ON public.notifications;
CREATE POLICY "notifications_admin_manage"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'admin'
  );


-- ==============================================================================
-- RELOAD POSTGREST SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
