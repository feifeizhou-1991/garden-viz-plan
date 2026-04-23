import React, { useEffect, useState } from 'react';
import { PlantedCell } from '@/types/garden';
import { Profile, useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
  Plus,
  ArrowLeft,
  UserCog,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  image_url: string | null;
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

export interface PlantInfoViewProps {
  /** When viewing a plant already placed on the grid. */
  cell?: PlantedCell | null;
  /** When viewing a plant from the catalog (no placement yet). */
  catalogPlant?: {
    slug: string;
    common_name: string;
    image_url?: string | null;
    category?: string;
  } | null;
  bedName?: string;
  planter?: Profile | null;
  assignee?: Profile | null;
  /** Show a "Back" affordance in the header (used inline in panels). */
  onBack?: () => void;
  backLabel?: string;
  /** Called when user removes the placed plant. */
  onRemove?: () => void;
  /** Called when user assigns the plant to a gardener (separate from planter). */
  onReassign?: (userId: string) => void;
  /** Called when the dialog/host should close (used by header X / Close). */
  onClose?: () => void;
  /** Show a primary "Place here" button. */
  onPlace?: () => void;
  placeLabel?: string;
  className?: string;
}

export const PlantInfoView: React.FC<PlantInfoViewProps> = ({
  cell,
  catalogPlant,
  bedName,
  planter,
  assignee,
  onBack,
  backLabel = 'Back',
  onRemove,
  onReassign,
  onClose,
  onPlace,
  placeLabel = 'Place here',
  className,
}) => {
  const [catalog, setCatalog] = useState<CatalogRow | null>(null);
  const [loadingCat, setLoadingCat] = useState(false);
  const { profiles } = useProfiles();
  const [assignOpen, setAssignOpen] = useState(false);

  const slug = cell?.slug ?? cell?.plant.id ?? catalogPlant?.slug;

  useEffect(() => {
    if (!slug) {
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
  }, [slug]);

  if (!cell && !catalogPlant) return null;

  const displayName =
    catalog?.common_name ?? cell?.plant.name ?? catalogPlant?.common_name ?? 'Plant';
  const displayIcon = cell?.plant.icon ?? catalog?.image_url ?? catalogPlant?.image_url ?? '';
  const displayCategory =
    catalog?.category ?? cell?.plant.type ?? catalogPlant?.category ?? '';
  const plantedAt = cell?.plantedAt;
  const plantedBy = cell?.plantedBy;
  const fallbackSeason = cell?.plant.season ?? [];
  const fallbackSpacing = cell?.plant.spacing ?? 1;

  const planterLabel =
    planter?.display_name ||
    planter?.email ||
    (plantedBy ? 'Unknown gardener' : 'Not recorded');
  const assignedTo = cell?.assignedTo;
  const assigneeLabel =
    assignee?.display_name ||
    assignee?.email ||
    (assignedTo ? 'Unknown gardener' : 'Unassigned');

  const plantedDate = plantedAt ? new Date(plantedAt) : null;
  const formattedDate = plantedDate ? fmtDate(plantedDate) : 'Not recorded';

  const harvestRows: { label: string; value: string }[] = [];
  if (catalog?.days_to_harvest_min || catalog?.days_to_harvest_max) {
    const min = catalog.days_to_harvest_min ?? catalog.days_to_harvest_max!;
    const max = catalog.days_to_harvest_max ?? catalog.days_to_harvest_min!;
    harvestRows.push({
      label: 'Days to harvest',
      value: min === max ? `${min} days` : `${min}–${max} days`,
    });
    if (plantedDate) {
      harvestRows.push({ label: 'Earliest harvest', value: fmtDate(addDays(plantedDate, min)) });
      harvestRows.push({ label: 'Latest harvest', value: fmtDate(addDays(plantedDate, max)) });
    }
  }
  if (catalog?.harvest_season?.length) {
    harvestRows.push({ label: 'Harvest season', value: catalog.harvest_season.join(', ') });
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b flex-shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </button>
        )}
        <div className="flex items-center gap-3">
          {displayIcon ? (
            <img
              src={displayIcon}
              alt={displayName}
              className="w-14 h-14 object-cover rounded-md border"
            />
          ) : (
            <div className="w-14 h-14 rounded-md border bg-muted" />
          )}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-lg font-semibold leading-tight truncate">{displayName}</span>
            {catalog?.scientific_name && (
              <span className="text-xs italic text-muted-foreground">{catalog.scientific_name}</span>
            )}
            {displayCategory && (
              <span className="text-xs capitalize text-muted-foreground">{displayCategory}</span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 text-sm">
        {/* Planting details (only for placed plants) */}
        {cell && (
          <section className="space-y-2">
            {bedName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sprout className="w-4 h-4" />
                <span>
                  {bedName} · row {cell.y + 1}, col {cell.x + 1}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Planted by</span>
              <span className="font-medium">{planterLabel}</span>
            </div>
            {onReassign && (
              <div className="flex items-center gap-2 flex-wrap">
                <UserCog className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to</span>
                <span className="font-medium">{assigneeLabel}</span>
                <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      {assignedTo ? 'Change' : 'Assign'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-64" align="start">
                    <Command>
                      <CommandInput placeholder="Search gardeners…" />
                      <CommandList>
                        <CommandEmpty>No gardeners found.</CommandEmpty>
                        <CommandGroup>
                          {Object.values(profiles)
                            .sort((a, b) =>
                              (a.display_name || a.email || '').localeCompare(
                                b.display_name || b.email || ''
                              )
                            )
                            .map((p) => {
                              const label = p.display_name || p.email || 'Unknown';
                              const isCurrent = p.user_id === assignedTo;
                              return (
                                <CommandItem
                                  key={p.user_id}
                                  value={`${label} ${p.email ?? ''}`}
                                  onSelect={() => {
                                    onReassign(p.user_id);
                                    setAssignOpen(false);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Avatar className="w-6 h-6">
                                    {p.avatar_url ? (
                                      <AvatarImage src={p.avatar_url} alt={label} />
                                    ) : null}
                                    <AvatarFallback className="text-[10px]">
                                      {label.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 truncate">{label}</span>
                                  {isCurrent && <Check className="w-3.5 h-3.5 text-primary" />}
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">On</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
          </section>
        )}

        {catalog?.description && (
          <p className="text-foreground/90 leading-relaxed">{catalog.description}</p>
        )}

        {loadingCat && !catalog && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading growing details…
          </div>
        )}

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
                        title={isHarvest ? 'Harvest' : isPlant ? 'Plant' : ''}
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
                    {catalog?.spacing ?? fallbackSpacing} cell
                    {(catalog?.spacing ?? fallbackSpacing) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

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

        {!catalog && !loadingCat && fallbackSeason.length ? (
          <div className="text-muted-foreground text-xs">
            Season: <span className="text-foreground">{fallbackSeason.join(', ')}</span>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      {(onRemove || onPlace || onClose) && (
        <div className="flex-shrink-0 border-t px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          {onRemove ? (
            <Button variant="destructive" size="sm" onClick={onRemove}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove plant
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
            {onPlace && (
              <Button size="sm" onClick={onPlace}>
                <Plus className="w-4 h-4 mr-1" />
                {placeLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};