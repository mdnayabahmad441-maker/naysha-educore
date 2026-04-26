create table if not exists public.school_whatsapp (
  school_id uuid primary key references public.schools(id) on delete cascade,
  access_token text,
  phone_number_id text,
  business_account_id text,
  phone_number text,
  display_name text,
  last_webhook_event_at timestamptz,
  last_webhook_status text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.school_whatsapp
  add column if not exists access_token text,
  add column if not exists phone_number_id text,
  add column if not exists business_account_id text,
  add column if not exists phone_number text,
  add column if not exists display_name text,
  add column if not exists last_webhook_event_at timestamptz,
  add column if not exists last_webhook_status text,
  add column if not exists connected_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
