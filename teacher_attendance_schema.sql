-- Run this in your Supabase SQL editor

-- Add GPS location + timing config to schools
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS check_in_start TIME DEFAULT '07:00:00',
  ADD COLUMN IF NOT EXISTS check_in_end   TIME DEFAULT '10:30:00',
  ADD COLUMN IF NOT EXISTS late_after     TIME DEFAULT '09:00:00';

-- Teacher self-attendance table
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL,
  school_id       UUID NOT NULL,
  date            DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'present',  -- present | late | absent
  check_in_time   TIMESTAMPTZ,
  check_out_time  TIMESTAMPTZ,
  check_in_lat    DECIMAL(10, 8),
  check_in_lng    DECIMAL(11, 8),
  check_out_lat   DECIMAL(10, 8),
  check_out_lng   DECIMAL(11, 8),
  distance_meters INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, date)
);

-- If the table already existed from an older/partial setup, add missing columns.
ALTER TABLE teacher_attendance
  ADD COLUMN IF NOT EXISTS teacher_id UUID,
  ADD COLUMN IF NOT EXISTS school_id UUID,
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'present',
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS check_in_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS check_out_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS check_out_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS distance_meters INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS teacher_attendance_teacher_date_key
  ON teacher_attendance (teacher_id, date);

-- Enable RLS
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Table privileges are still required even when RLS policies exist.
-- This fixes "permission denied for table teacher_attendance" in the teacher app.
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teacher_attendance TO authenticated, service_role;

-- Existing projects may have a bigint/serial id from an older setup.
-- Grant its sequence only when that sequence exists.
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

-- Re-running setup should replace these policies cleanly.
DROP POLICY IF EXISTS "teacher_attendance_self" ON teacher_attendance;
DROP POLICY IF EXISTS "teacher_attendance_admin" ON teacher_attendance;

-- Teachers can read/write their own records
CREATE POLICY "teacher_attendance_self"
  ON teacher_attendance FOR ALL
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_id = auth.uid()
    )
  );

-- Admins can read all records for their school
CREATE POLICY "teacher_attendance_admin"
  ON teacher_attendance FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Refresh Supabase/PostgREST cache after new columns, grants, and policies.
NOTIFY pgrst, 'reload schema';
