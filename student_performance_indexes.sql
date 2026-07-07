-- Run in Supabase SQL Editor to speed up Students, attendance, fees, and class lists.

CREATE INDEX IF NOT EXISTS students_school_name_idx
ON public.students (school_id, name);

CREATE INDEX IF NOT EXISTS students_school_code_idx
ON public.students (school_id, student_code);

CREATE INDEX IF NOT EXISTS student_enrollments_school_year_class_roll_idx
ON public.student_enrollments (school_id, academic_year_id, class_id, roll_number);

CREATE INDEX IF NOT EXISTS student_enrollments_school_student_year_idx
ON public.student_enrollments (school_id, student_id, academic_year_id);

CREATE INDEX IF NOT EXISTS classes_school_name_idx
ON public.classes (school_id, name);

NOTIFY pgrst, 'reload schema';
