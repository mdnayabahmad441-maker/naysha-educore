create table if not exists public.school_whatsapp (
  school_id uuid primary key references public.schools(id) on delete cascade,
  provider text default 'twilio_whatsapp',
  account_sid text,
  auth_token text,
  from_number text,
  display_name text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.school_whatsapp
  add column if not exists provider text default 'twilio_whatsapp',
  add column if not exists account_sid text,
  add column if not exists auth_token text,
  add column if not exists from_number text,
  add column if not exists display_name text,
  add column if not exists connected_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
