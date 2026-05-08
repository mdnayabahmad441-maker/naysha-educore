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
  teacher_id      UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  school_id       UUID NOT NULL REFERENCES schools(id)  ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Teachers can read/write their own records
CREATE POLICY "teacher_attendance_self"
  ON teacher_attendance FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_id = auth.uid()
    )
  );

-- Admins can read all records for their school
CREATE POLICY "teacher_attendance_admin"
  ON teacher_attendance FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
