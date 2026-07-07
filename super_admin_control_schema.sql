-- Run this in Supabase SQL Editor to enable the full Super Admin control panel.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_ends_at DATE,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'schools_status_check'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_status_check
      CHECK (status IN ('active', 'suspended', 'trial'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'schools_subscription_status_check'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_subscription_status_check
      CHECK (subscription_status IN ('trial', 'paid', 'past_due', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS schools_status_idx ON public.schools(status);
CREATE INDEX IF NOT EXISTS schools_subscription_status_idx ON public.schools(subscription_status);
CREATE INDEX IF NOT EXISTS schools_ai_enabled_idx ON public.schools(ai_enabled);

NOTIFY pgrst, 'reload schema';
