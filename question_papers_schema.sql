-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS question_papers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id   UUID REFERENCES teachers(id) ON DELETE SET NULL,
  class        TEXT    NOT NULL,
  subject      TEXT    NOT NULL,
  chapter      TEXT    NOT NULL,
  topic        TEXT,
  difficulty   TEXT    NOT NULL,
  total_marks  INTEGER NOT NULL,
  content      TEXT    NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qp_teacher_own"
  ON question_papers FOR ALL
  USING (
    teacher_id IN (SELECT id FROM teachers WHERE auth_id = auth.uid())
  );

CREATE POLICY "qp_admin_school"
  ON question_papers FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
