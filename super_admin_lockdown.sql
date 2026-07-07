-- Run this once in Supabase SQL Editor.
-- It makes groenics@gmail.com the only Super Admin account.

UPDATE auth.users
SET raw_user_meta_data =
  jsonb_set(
    jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"super_admin"', true),
    '{active_role}',
    '"super_admin"',
    true
  )
WHERE lower(email) = 'groenics@gmail.com';

UPDATE auth.users
SET raw_user_meta_data =
  (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'role' - 'active_role')
WHERE lower(email) <> 'groenics@gmail.com'
  AND (
    raw_user_meta_data->>'role' = 'super_admin'
    OR raw_user_meta_data->>'active_role' = 'super_admin'
  );

INSERT INTO public.profiles (id, role, school_id)
SELECT id, 'super_admin', NULL
FROM auth.users
WHERE lower(email) = 'groenics@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    school_id = NULL;

UPDATE public.profiles
SET role = 'admin'
WHERE role = 'super_admin'
  AND id NOT IN (
    SELECT id FROM auth.users WHERE lower(email) = 'groenics@gmail.com'
  );

NOTIFY pgrst, 'reload schema';
