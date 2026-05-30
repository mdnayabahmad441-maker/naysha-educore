-- Admission Module Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admissions (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id         UUID        NOT NULL,
  admission_number  TEXT        NOT NULL,
  student_name      TEXT        NOT NULL,
  date_of_birth     DATE,
  gender            TEXT        CHECK (gender IN ('male', 'female', 'other')),
  father_name       TEXT,
  mother_name       TEXT,
  phone             TEXT        NOT NULL,
  email             TEXT,
  address           TEXT,
  class_applied     TEXT        NOT NULL,
  section           TEXT,
  academic_year     TEXT,
  previous_school   TEXT,
  documents         JSONB,
  entrance_test_score NUMERIC,
  merit_rank        INTEGER,
  auto_confirmed    BOOLEAN     DEFAULT false,
  confirmation_sent_at TIMESTAMPTZ,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'enrolled', 'rejected')),
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, admission_number)
);

CREATE INDEX IF NOT EXISTS idx_admissions_school_id ON admissions (school_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status    ON admissions (status);

-- Row Level Security
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage their admissions"
  ON admissions FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
