import React, { useEffect, useState } from 'react';
import { PlantedCell } from '@/types/garden';
import { Profile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Trash2,
  User,
  Calendar,
  Sprout,
  Sun,
  Droplets,
  Ruler,
  Loader2,
  Heart,
  Ban,
} from 'lucide-react';

type CatalogRow = {
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: string;
  season: string[];
  description: string | null;
  spacing: number;
  days_to_harvest_min: number | null;
  days_to_harvest_max: number | null;
  harvest_season: string[];
  sun: string | null;
  water: string | null;
  planting_depth_cm: number | null;
  companions: string[];
  avoid: string[];
};

const ALL_SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface PlantInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: PlantedCell | null;
  bedName?: string;
  planter?: Profile | null;
  onRemove: () => void;
}

export const PlantInfoDialog: React.FC<PlantInfoDialogProps> = ({
  open,
  onOpenChange,
  cell,
  bedName,
  planter,
  onRemove,
}) => {
  const [catalog, setCatalog] = useState<CatalogRow | null>(null);
  const [loadingCat, setLoadingCat] = useState(false);

  // The plant.id matches plant_catalog.slug for AI-curated plants
  const slug = cell?.slug ?? cell?.plant.id;

  useEffect(() => {
    if (!open || !slug) {
      setCatalog(null);
      return;
    }
    let cancelled = false;
    setLoadingCat(true);
    (async () => {
      const { data } = await (supabase as any)
        .from('plant_catalog')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!cancelled) {
        setCatalog((data as CatalogRow) ?? null);
        setLoadingCat(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  if (!cell) return null;
  const { plant, plantedAt, plantedBy } = cell;

  const planterLabel =
    planter?.display_name ||
    planter?.email ||
    (plantedBy ? 'Unknown gardener' : 'Not recorded');

  const plantedDate = plantedAt ? new Date(plantedAt) : null;
  const formattedDate = plantedDate ? fmtDate(plantedDate) : 'Not recorded';

  // Build harvest projection table
  const harvestRows: { label: string; value: string }[] = [];
  if (catalog?.days_to_harvest_min || catalog?.days_to_harvest_max) {
    const min = catalog.days_to_harvest_min ?? catalog.days_to_harvest_max!;
    const max = catalog.days_to_harvest_max ?? catalog.days_to_harvest_min!;
    harvestRows.push({
      label: 'Days to harvest',
      value: min === max ? `${min} days` : `${min}–${max} days`,
    });
    if (plantedDate) {
      harvestRows.push({
        label: 'Earliest harvest',
        value: fmtDate(addDays(plantedDate, min)),
      });
      harvestRows.push({
        label: 'Latest harvest',
        value: fmtDate(addDays(plantedDate, max)),
      });
    }
  }
  if (catalog?.harvest_season?.length) {
    harvestRows.push({ label: 'Harvest season', value: catalog.harvest_season.join(', ') });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <img
              src={plant.icon}
              alt={plant.name}
              className="w-14 h-14 object-cover rounded-md border"
            />
            <div className="flex flex-col items-start">
              <span className="text-lg">{catalog?.common_name ?? plant.name}</span>
              {catalog?.scientific_name && (
                <span className="text-xs italic text-muted-foreground font-normal">
                  {catalog.scientific_name}
                </span>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="capitalize">
            {catalog?.category ?? plant.type}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-5 text-sm">
            {/* Planting details */}
            <section className="space-y-2">
              {bedName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sprout className="w-4 h-4" />
                  <span>
                    {bedName} · row {cell.y + 1}, col {cell.x + 1}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Planted by</span>
                <span className="font-medium">{planterLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">On</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
            </section>

            {/* Description */}
            {catalog?.description && (
              <p className="text-foreground/90 leading-relaxed">{catalog.description}</p>
            )}

            {loadingCat && !catalog && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading growing details…
              </div>
            )}

            {/* Harvest table */}
            {harvestRows.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Harvest
                </h4>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableBody>
                      {harvestRows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="py-2 px-3 text-muted-foreground w-2/5">
                            {row.label}
                          </TableCell>
                          <TableCell className="py-2 px-3 font-medium">{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Visual season strip */}
                {catalog?.harvest_season?.length ? (
                  <div className="mt-3">
                    <div className="text-[11px] text-muted-foreground mb-1">Season at a glance</div>
                    <div className="grid grid-cols-4 gap-1">
                      {ALL_SEASONS.map((s) => {
                        const isHarvest = catalog.harvest_season.includes(s);
                        const isPlant = catalog.season.includes(s);
                        return (
                          <div
                            key={s}
                            className={
                              'rounded text-[10px] text-center py-1 px-1 border ' +
                              (isHarvest
                                ? 'bg-primary/15 border-primary/30 text-foreground'
                                : isPlant
                                ? 'bg-muted border-border text-muted-foreground'
                                : 'bg-background border-border text-muted-foreground/50')
                            }
                            title={
                              isHarvest ? 'Harvest' : isPlant ? 'Plant' : ''
                            }
                          >
                            <div>{s}</div>
                            <div className="text-[9px]">
                              {isHarvest ? '🧺 harvest' : isPlant ? '🌱 plant' : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {/* Care details */}
            {(catalog?.sun || catalog?.water || catalog?.planting_depth_cm || catalog?.spacing) && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Care
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {catalog?.sun && (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <Sun className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-[10px] text-muted-foreground">Sun</div>
                        <div className="font-medium text-xs">{catalog.sun}</div>
                      </div>
                    </div>
                  )}
                  {catalog?.water && (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <Droplets className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-[10px] text-muted-foreground">Water</div>
                        <div className="font-medium text-xs">{catalog.water}</div>
                      </div>
                    </div>
                  )}
                  {catalog?.planting_depth_cm != null && (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-[10px] text-muted-foreground">Depth</div>
                        <div className="font-medium text-xs">{catalog.planting_depth_cm} cm</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Sprout className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Spacing</div>
                      <div className="font-medium text-xs">
                        {catalog?.spacing ?? plant.spacing} cell
                        {(catalog?.spacing ?? plant.spacing) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Companions / avoid */}
            {(catalog?.companions?.length || catalog?.avoid?.length) ? (
              <section className="space-y-2">
                {catalog?.companions?.length ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      <Heart className="w-3 h-3 text-primary" /> Good companions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {catalog.companions.map((c) => (
                        <Badge key={c} variant="secondary" className="font-normal">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {catalog?.avoid?.length ? (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      <Ban className="w-3 h-3 text-destructive" /> Avoid nearby
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {catalog.avoid.map((c) => (
                        <Badge key={c} variant="outline" className="font-normal">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Fallback for legacy plants without catalog row */}
            {!catalog && !loadingCat && plant.season?.length ? (
              <div className="text-muted-foreground text-xs">
                Season: <span className="text-foreground">{plant.season.join(', ')}</span>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:justify-between border-t px-6 py-3">
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="w-4 h-4 mr-2" />
            Remove plant
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
