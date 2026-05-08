-- Add ui_theme column to schools table (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'ui_theme'
  ) THEN
    ALTER TABLE schools
    ADD COLUMN ui_theme TEXT NOT NULL DEFAULT 'dark-glass';
  END IF;
END;
$$;

-- Add check constraint (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'schools' AND constraint_name = 'schools_ui_theme_check'
  ) THEN
    ALTER TABLE schools
    ADD CONSTRAINT schools_ui_theme_check
    CHECK (ui_theme IN (
      'dark-glass',
      'neon-brutalist',
      'luxury-editorial',
      'soft-neomorphic',
      'cosmic',
      'emerald',
      'crimson-noir'
    ));
  END IF;
END;
$$;
