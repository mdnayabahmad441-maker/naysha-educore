

create extension if not exists pgcrypto;

create or replace function public.current_user_school_id()
returns uuid
language sql
stable
as $$
  select school_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

alter table if exists public.profiles enable row level security;
alter table if exists public.schools enable row level security;
alter table if exists public.classes enable row level security;
alter table if exists public.subjects enable row level security;
alter table if exists public.students enable row level security;
alter table if exists public.parents enable row level security;
alter table if exists public.teachers enable row level security;
alter table if exists public.teacher_classes enable row level security;
alter table if exists public.teacher_subjects enable row level security;
alter table if exists public.fees enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.academic_years enable row level security;
alter table if exists public.student_enrollments enable row level security;
alter table if exists public.attendance enable row level security;
alter table if exists public.exams enable row level security;
alter table if exists public.exam_subjects enable row level security;
alter table if exists public.marks enable row level security;
alter table if exists public.results enable row level security;
alter table if exists public.report_cards enable row level security;
alter table if exists public.settings enable row level security;
alter table if exists public.class_fee_settings enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.notifications_log enable row level security;
alter table if exists public.admission_enquiries enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "schools same school read" on public.schools;
create policy "schools same school read"
on public.schools
for select
using (id = public.current_user_school_id());

drop policy if exists "schools admin update" on public.schools;
create policy "schools admin update"
on public.schools
for update
using (
  id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read classes" on public.classes;
create policy "same school read classes"
on public.classes
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage classes" on public.classes;
create policy "admin manage classes"
on public.classes
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own classes" on public.classes;
create policy "teacher read own classes"
on public.classes
for select
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'teacher'
  and id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
);

drop policy if exists "same school read subjects" on public.subjects;
create policy "same school read subjects"
on public.subjects
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage subjects" on public.subjects;
create policy "admin manage subjects"
on public.subjects
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own subjects" on public.subjects;
create policy "teacher read own subjects"
on public.subjects
for select
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'teacher'
  and id in (select subject_id from public.teacher_subjects where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
);

drop policy if exists "same school read students" on public.students;
create policy "same school read students"
on public.students
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage students" on public.students;
create policy "admin manage students"
on public.students
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own students" on public.students;
create policy "teacher read own students"
on public.students
for select
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'teacher'
  and id in (
    select student_id from public.student_enrollments 
    where class_id in (
      select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid())
    )
  )
);

drop policy if exists "same school read parents" on public.parents;
create policy "same school read parents"
on public.parents
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage parents" on public.parents;
create policy "admin manage parents"
on public.parents
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read teachers" on public.teachers;
create policy "same school read teachers"
on public.teachers
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage teachers" on public.teachers;
create policy "admin manage teachers"
on public.teachers
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own profile" on public.teachers;
create policy "teacher read own profile"
on public.teachers
for select
using (
  auth_id = auth.uid()
);

drop policy if exists "same school read teacher_classes" on public.teacher_classes;
create policy "same school read teacher_classes"
on public.teacher_classes
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage teacher_classes" on public.teacher_classes;
create policy "admin manage teacher_classes"
on public.teacher_classes
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own classes" on public.teacher_classes;
create policy "teacher read own classes"
on public.teacher_classes
for select
using (
  teacher_id = (select id from public.teachers where auth_id = auth.uid())
);

drop policy if exists "same school read teacher_subjects" on public.teacher_subjects;
create policy "same school read teacher_subjects"
on public.teacher_subjects
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage teacher_subjects" on public.teacher_subjects;
create policy "admin manage teacher_subjects"
on public.teacher_subjects
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own subjects" on public.teacher_subjects;
create policy "teacher read own subjects"
on public.teacher_subjects
for select
using (
  teacher_id = (select id from public.teachers where auth_id = auth.uid())
);

drop policy if exists "same school read fees" on public.fees;
create policy "same school read fees"
on public.fees
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage fees" on public.fees;
create policy "admin manage fees"
on public.fees
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read payments" on public.payments;
create policy "same school read payments"
on public.payments
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage payments" on public.payments;
create policy "admin manage payments"
on public.payments
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read academic years" on public.academic_years;
create policy "same school read academic years"
on public.academic_years
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage academic years" on public.academic_years;
create policy "admin manage academic years"
on public.academic_years
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read enrollments" on public.student_enrollments;
create policy "same school read enrollments"
on public.student_enrollments
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage enrollments" on public.student_enrollments;
create policy "admin manage enrollments"
on public.student_enrollments
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "teacher read own class enrollments" on public.student_enrollments;
create policy "teacher read own class enrollments"
on public.student_enrollments
for select
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'teacher'
  and class_id in (
    select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid())
  )
);

drop policy if exists "same school read attendance" on public.attendance;
create policy "same school read attendance"
on public.attendance
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin teacher manage attendance" on public.attendance;
create policy "admin teacher manage attendance"
on public.attendance
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
  and (
    public.current_user_role() = 'admin'
    or class_id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
  )
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
  and (
    public.current_user_role() = 'admin'
    or class_id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
  )
);

drop policy if exists "same school read exams" on public.exams;
create policy "same school read exams"
on public.exams
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin teacher manage exams" on public.exams;
create policy "admin teacher manage exams"
on public.exams
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
  and (
    public.current_user_role() = 'admin'
    or class_id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
  )
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
  and (
    public.current_user_role() = 'admin'
    or class_id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
  )
);

drop policy if exists "same school read exam subjects" on public.exam_subjects;
create policy "same school read exam subjects"
on public.exam_subjects
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin teacher manage exam subjects" on public.exam_subjects;
create policy "admin teacher manage exam subjects"
on public.exam_subjects
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
);

drop policy if exists "same school read marks" on public.marks;
create policy "same school read marks"
on public.marks
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin teacher manage marks" on public.marks;
create policy "admin teacher manage marks"
on public.marks
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
  and (
    public.current_user_role() = 'admin'
    or student_id in (
      select student_id from public.student_enrollments 
      where class_id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
    )
  )
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
  and (
    public.current_user_role() = 'admin'
    or student_id in (
      select student_id from public.student_enrollments 
      where class_id in (select class_id from public.teacher_classes where teacher_id = (select id from public.teachers where auth_id = auth.uid()))
    )
  )
);

drop policy if exists "same school read results" on public.results;
create policy "same school read results"
on public.results
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin teacher manage results" on public.results;
create policy "admin teacher manage results"
on public.results
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
);

drop policy if exists "same school read report cards" on public.report_cards;
create policy "same school read report cards"
on public.report_cards
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin teacher manage report cards" on public.report_cards;
create policy "admin teacher manage report cards"
on public.report_cards
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() in ('admin', 'teacher')
);

drop policy if exists "same school read settings" on public.settings;
create policy "same school read settings"
on public.settings
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage settings" on public.settings;
create policy "admin manage settings"
on public.settings
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read class fee settings" on public.class_fee_settings;
create policy "same school read class fee settings"
on public.class_fee_settings
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage class fee settings" on public.class_fee_settings;
create policy "admin manage class fee settings"
on public.class_fee_settings
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read notifications" on public.notifications;
create policy "same school read notifications"
on public.notifications
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage notifications" on public.notifications;
create policy "admin manage notifications"
on public.notifications
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "same school read notifications log" on public.notifications_log;
create policy "same school read notifications log"
on public.notifications_log
for select
using (school_id = public.current_user_school_id());

drop policy if exists "admin manage notifications log" on public.notifications_log;
create policy "admin manage notifications log"
on public.notifications_log
for all
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "public create admission enquiries" on public.admission_enquiries;
create policy "public create admission enquiries"
on public.admission_enquiries
for insert
with check (true);

drop policy if exists "same school read admission enquiries" on public.admission_enquiries;
create policy "same school read admission enquiries"
on public.admission_enquiries
for select
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "admin update admission enquiries" on public.admission_enquiries;
create policy "admin update admission enquiries"
on public.admission_enquiries
for update
using (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
)
with check (
  school_id = public.current_user_school_id()
  and public.current_user_role() = 'admin'
);

CREATE TABLE IF NOT EXISTS admission_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  class_wanted TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'admitted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_enquiries_school_id ON admission_enquiries(school_id);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_status ON admission_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_created_at ON admission_enquiries(created_at DESC);

ALTER TABLE admission_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert admission enquiries" ON admission_enquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow school admins to view admission enquiries" ON admission_enquiries
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow school admins to update admission enquiries" ON admission_enquiries
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS class_teacher_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_auth_id ON public.teachers(auth_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON public.teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON public.exams(class_id);

INSERT INTO public.teachers (id, school_id, name, email, auth_id)
SELECT 
  gen_random_uuid(),
  p.school_id,
  COALESCE(p.full_name, 'Teacher'),
  p.email,
  p.id
FROM public.profiles p
WHERE p.role = 'teacher'
AND NOT EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.auth_id = p.id
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.teachers t
SET auth_id = p.id
FROM public.profiles p
WHERE p.email = t.email
AND t.auth_id IS NULL;
