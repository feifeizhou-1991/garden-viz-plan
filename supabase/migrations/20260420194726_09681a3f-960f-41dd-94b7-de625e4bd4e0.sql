-- Gardens table (shared across all signed-in users)
CREATE TABLE public.gardens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plot_width INTEGER NOT NULL DEFAULT 12,
  plot_height INTEGER NOT NULL DEFAULT 8,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Beds table
CREATE TABLE public.garden_beds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garden_id UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT false,
  plants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_garden_beds_garden_id ON public.garden_beds(garden_id);

-- Enable RLS
ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_beds ENABLE ROW LEVEL SECURITY;

-- Policies: any authenticated user can do anything (community garden)
CREATE POLICY "Authenticated users can view gardens"
  ON public.gardens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert gardens"
  ON public.gardens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gardens"
  ON public.gardens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gardens"
  ON public.gardens FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view beds"
  ON public.garden_beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert beds"
  ON public.garden_beds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update beds"
  ON public.garden_beds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete beds"
  ON public.garden_beds FOR DELETE TO authenticated USING (true);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_gardens_updated_at
  BEFORE UPDATE ON public.gardens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garden_beds_updated_at
  BEFORE UPDATE ON public.garden_beds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.gardens REPLICA IDENTITY FULL;
ALTER TABLE public.garden_beds REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gardens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.garden_beds;

-- Seed initial garden
INSERT INTO public.gardens (name) VALUES ('Garden 2026');