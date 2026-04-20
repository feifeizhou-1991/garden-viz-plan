ALTER TABLE public.plant_catalog
  ADD COLUMN IF NOT EXISTS days_to_harvest_min integer,
  ADD COLUMN IF NOT EXISTS days_to_harvest_max integer,
  ADD COLUMN IF NOT EXISTS harvest_season text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sun text,
  ADD COLUMN IF NOT EXISTS water text,
  ADD COLUMN IF NOT EXISTS planting_depth_cm numeric,
  ADD COLUMN IF NOT EXISTS companions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoid text[] NOT NULL DEFAULT '{}';