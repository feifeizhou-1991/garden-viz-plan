import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Garden, GardenBed, PlantedCell } from '@/types/garden';
import { FIXED_BED_LAYOUT } from '@/data/fixedBedLayout';

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
 * Ensure the garden has the fixed bed layout. Reconciles by name:
 * - inserts beds that are missing
 * - updates position/size of existing beds to match the template
 * Existing plants are preserved on matching beds.
 * Beds whose name is not part of the template are left untouched.
 */
export async function ensureFixedLayout(garden: Garden): Promise<void> {
  const existing = garden.beds || [];
  const byName = new Map(existing.map((b) => [b.name, b]));

  const inserts: any[] = [];
  const updates: { id: string; patch: any }[] = [];

  for (const tpl of FIXED_BED_LAYOUT) {
    const found = byName.get(tpl.name);
    if (!found) {
      inserts.push({
        garden_id: garden.id,
        name: tpl.name,
        width: tpl.width,
        height: tpl.height,
        x: tpl.x,
        y: tpl.y,
        pinned: true,
        plants: [],
      });
    } else if (
      found.width !== tpl.width ||
      found.height !== tpl.height ||
      found.x !== tpl.x ||
      found.y !== tpl.y ||
      !found.pinned
    ) {
      updates.push({
        id: found.id,
        patch: {
          width: tpl.width,
          height: tpl.height,
          x: tpl.x,
          y: tpl.y,
          pinned: true,
        },
      });
    }
  }

  if (inserts.length) {
    // @ts-ignore
    await supabase.from('garden_beds').insert(inserts);
  }
  for (const u of updates) {
    // @ts-ignore
    await supabase.from('garden_beds').update(u.patch).eq('id', u.id);
  }
}

/**
 * Sync the in-memory garden's beds to the database.
 * Strategy: upsert each bed by id (no delete-all, to avoid races
 * with ensureFixedLayout and realtime that previously caused
 * duplicate beds and lost plants).
 */
export async function syncGardenBeds(garden: Garden) {
  const beds: GardenBed[] = garden.beds || [];
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
  const { error } = await supabase
    .from('garden_beds')
    .upsert(rows as any, { onConflict: 'id' });
  if (error) throw error;
}