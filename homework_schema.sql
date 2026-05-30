-- Homework / Assignments Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS homework (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id    UUID        NOT NULL,
  class_id     UUID        NOT NULL,
  subject      TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  description  TEXT,
  due_date     DATE        NOT NULL,
  assigned_by  UUID,                         -- teacher's profile id
  teacher_name TEXT,                         -- denormalised for display
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_school_id  ON homework (school_id);
CREATE INDEX IF NOT EXISTS idx_homework_class_id   ON homework (class_id);
CREATE INDEX IF NOT EXISTS idx_homework_due_date   ON homework (due_date);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- Admins and teachers of the same school can read/write
CREATE POLICY "School members can manage homework"
  ON homework FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );
