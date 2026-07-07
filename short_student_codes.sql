-- Optional: run this in Supabase SQL Editor to create compact student IDs
-- and clean class-wise roll numbers.
--
-- Student ID:
-- Compact and unique per school, for example STA001, STA002, STA999, STB001.
-- This is much smaller for ID cards than date-time based IDs.
--
-- Roll Number:
-- CLASS-WISE. Each class starts from 1.
-- Example: Class 10A gets Roll 1, 2, 3...
--          Class 9A also gets Roll 1, 2, 3...

DROP INDEX IF EXISTS public.students_school_student_code_unique;

WITH numbered_students AS (
  SELECT
    ctid AS row_id,
    ROW_NUMBER() OVER (
      PARTITION BY school_id
      ORDER BY created_at NULLS LAST, name, id, ctid
    ) AS seq
  FROM public.students
),
compact_students AS (
  SELECT
    row_id,
    'ST' ||
    chr(65 + ((seq - 1) / 999)::int) ||
    LPAD((((seq - 1) % 999) + 1)::text, 3, '0') AS compact_code
  FROM numbered_students
)
UPDATE public.students AS s
SET student_code = compact_students.compact_code
FROM compact_students
WHERE compact_students.row_id = s.ctid;

CREATE UNIQUE INDEX students_school_student_code_unique
ON public.students (school_id, student_code)
WHERE student_code IS NOT NULL;

WITH numbered_enrollments AS (
  SELECT
    ctid AS row_id,
    ROW_NUMBER() OVER (
      PARTITION BY school_id, academic_year_id, class_id
      ORDER BY roll_number NULLS LAST, student_id, id, ctid
    ) AS next_roll
  FROM public.student_enrollments
  WHERE class_id IS NOT NULL
)
UPDATE public.student_enrollments AS se
SET roll_number = numbered_enrollments.next_roll
FROM numbered_enrollments
WHERE numbered_enrollments.row_id = se.ctid;

UPDATE public.students AS s
SET roll_number = se.roll_number,
    class_id = COALESCE(se.class_id, s.class_id)
FROM public.student_enrollments AS se
WHERE se.student_id = s.id
  AND se.roll_number IS NOT NULL;

NOTIFY pgrst, 'reload schema';
