-- 1. Plant catalog table
CREATE TABLE public.plant_catalog (
  slug TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('vegetable','herb','fruit','flower','tree','other')),
  season TEXT[] NOT NULL DEFAULT '{}',
  spacing INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plant_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read the shared catalog
CREATE POLICY "Authenticated users can view plant catalog"
  ON public.plant_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Writes happen only via edge functions (service role bypasses RLS).
-- We intentionally don't add INSERT/UPDATE/DELETE policies for normal users.

-- Auto-update updated_at
CREATE TRIGGER update_plant_catalog_updated_at
  BEFORE UPDATE ON public.plant_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Public storage bucket for AI-generated plant icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-icons', 'plant-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view icons (bucket is public)
CREATE POLICY "Plant icons are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-icons');

-- Writes happen only via edge functions (service role).
