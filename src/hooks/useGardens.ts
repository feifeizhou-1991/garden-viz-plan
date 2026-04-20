import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Garden, GardenBed, PlantedCell } from '@/types/garden';

type GardenRow = {
  id: string;
  name: string;
  plot_width: number;
  plot_height: number;
  created_at: string;
};

type BedRow = {
  id: string;
  garden_id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  pinned: boolean;
  plants: PlantedCell[];
};

const buildGarden = (g: GardenRow, beds: BedRow[]): Garden => ({
  id: g.id,
  name: g.name,
  createdAt: new Date(g.created_at),
  plot: { width: g.plot_width, height: g.plot_height, plants: [] },
  beds: beds
    .filter((b) => b.garden_id === g.id)
    .map((b) => ({
      id: b.id,
      name: b.name,
      width: b.width,
      height: b.height,
      x: b.x,
      y: b.y,
      pinned: b.pinned,
      plants: Array.isArray(b.plants) ? b.plants : [],
    })),
});

export function useGardens() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: gs }, { data: bs }] = await Promise.all([
      // @ts-ignore - tables not yet in generated types
      supabase.from('gardens').select('*').order('created_at', { ascending: false }),
      // @ts-ignore
      supabase.from('garden_beds').select('*'),
    ]);
    const gRows = (gs || []) as unknown as GardenRow[];
    const bRows = (bs || []) as unknown as BedRow[];
    setGardens(gRows.map((g) => buildGarden(g, bRows)));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('gardens-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gardens' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garden_beds' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { gardens, loading, reload: load };
}

export async function createGarden(name: string) {
  const { data: user } = await supabase.auth.getUser();
  // @ts-ignore
  const { data, error } = await supabase
    .from('gardens')
    .insert({ name, created_by: user.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameGarden(id: string, name: string) {
  // @ts-ignore
  const { error } = await supabase.from('gardens').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteGarden(id: string) {
  // @ts-ignore
  const { error } = await supabase.from('gardens').delete().eq('id', id);
  if (error) throw error;
}

export async function getGardenById(id: string): Promise<Garden | null> {
  const [{ data: g }, { data: bs }] = await Promise.all([
    // @ts-ignore
    supabase.from('gardens').select('*').eq('id', id).maybeSingle(),
    // @ts-ignore
    supabase.from('garden_beds').select('*').eq('garden_id', id),
  ]);
  if (!g) return null;
  return buildGarden(g as unknown as GardenRow, (bs || []) as unknown as BedRow[]);
}

/**
 * Sync the in-memory garden's beds to the database.
 * Strategy: replace all beds for this garden (delete + insert).
 * This keeps the client logic simple while staying consistent.
 */
export async function syncGardenBeds(garden: Garden) {
  const beds: GardenBed[] = garden.beds || [];
  // @ts-ignore
  await supabase.from('garden_beds').delete().eq('garden_id', garden.id);
  if (beds.length === 0) return;
  const rows = beds.map((b) => ({
    id: b.id,
    garden_id: garden.id,
    name: b.name,
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
    pinned: b.pinned ?? false,
    plants: b.plants as unknown as object,
  }));
  // @ts-ignore
  const { error } = await supabase.from('garden_beds').insert(rows);
  if (error) throw error;
}