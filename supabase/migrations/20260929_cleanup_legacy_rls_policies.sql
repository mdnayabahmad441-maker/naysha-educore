-- ==============================================================================
-- NAYSHA EDUCORE — PHASE 3C LEGACY RLS POLICY CLEANUP
-- Migration: 20260929_cleanup_legacy_rls_policies.sql
-- Target: xrgwvppbcnnqguduxgeg
-- 
-- DESCRIPTION:
--   Removes the 33 pre-existing, unconditional legacy policies that bypass tenant
--   isolation and leak data across school tenants.
--   Replacement coverage has been 100% verified in 20260929_security_rls_hardening.sql.
-- ==============================================================================

-- 1. DROP UNCONDITIONAL POLICIES ON STUDENTS & PARENTS
DROP POLICY IF EXISTS "Students access" ON public.students;
DROP POLICY IF EXISTS "allow all students" ON public.students;
DROP POLICY IF EXISTS "students_all" ON public.students;

DROP POLICY IF EXISTS "parents_all" ON public.parents;

-- 2. DROP UNCONDITIONAL POLICIES ON FINANCIAL DATA
DROP POLICY IF EXISTS "fees_all" ON public.fees;
DROP POLICY IF EXISTS "payments_all" ON public.payments;

-- 3. DROP UNCONDITIONAL POLICIES ON ATTENDANCE, MARKS & EVALUATIONS
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;

DROP POLICY IF EXISTS "allow all marks" ON public.marks;
DROP POLICY IF EXISTS "allow all results" ON public.results;

-- 4. DROP UNCONDITIONAL POLICIES ON ACADEMIC STRUCTURE
DROP POLICY IF EXISTS "Allow read classes" ON public.classes;
DROP POLICY IF EXISTS "classes_all" ON public.classes;

DROP POLICY IF EXISTS "Allow select subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow update subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow delete subjects" ON public.subjects;

DROP POLICY IF EXISTS "Allow all for now" ON public.academic_years;
DROP POLICY IF EXISTS "allow all academic years" ON public.academic_years;

DROP POLICY IF EXISTS "Allow select for school" ON public.exams;
DROP POLICY IF EXISTS "all exams" ON public.exams;
DROP POLICY IF EXISTS "allow all exams" ON public.exams;
DROP POLICY IF EXISTS "Allow update" ON public.exams;

DROP POLICY IF EXISTS "all exam subjects" ON public.exam_subjects;

DROP POLICY IF EXISTS "allow all" ON public.teacher_classes;
DROP POLICY IF EXISTS "allow all" ON public.teacher_subjects;

-- 5. DROP MISCONFIGURED PUBLIC POLICY ON CREDENTIALS & SETTINGS
DROP POLICY IF EXISTS "service role full access" ON public.school_whatsapp;

DROP POLICY IF EXISTS "allow all" ON public.settings;
DROP POLICY IF EXISTS "full_access_settings" ON public.settings;
DROP POLICY IF EXISTS "full_access_class_fee" ON public.class_fee_settings;

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;

-- 6. REVOKE REMAINING ANON PRIVILEGES FROM ACADEMIC LOOKUP TABLES (DEFENSE-IN-DEPTH)
REVOKE ALL ON TABLE
  public.classes,
  public.subjects,
  public.academic_years,
  public.exams,
  public.teacher_classes,
  public.teacher_subjects,
  public.exam_subjects,
  public.class_fee_settings
FROM anon;

-- Ensure authenticated and service_role retain authorized access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.classes,
  public.subjects,
  public.academic_years,
  public.exams,
  public.teacher_classes,
  public.teacher_subjects,
  public.exam_subjects,
  public.class_fee_settings
TO authenticated, service_role;

-- 7. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
