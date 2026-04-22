import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Garden, GardenBed, Plant, PlantedCell } from '@/types/garden';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Sparkles, Check, X, Search, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type CatalogPlant = {
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: string;
  season: string[];
  spacing: number;
  description: string | null;
  image_url: string | null;
};

type Placement = {
  plant_slug: string;
  common_name: string;
  x: number;
  y: number;
};

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: CatalogPlant[];
  proposal?: { bed_id: string; rationale: string; placements: Placement[] };
};

interface AssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garden: Garden;
  // The cell that triggered the drawer (optional — drawer can also be opened standalone)
  targetCell: { bedId: string; x: number; y: number } | null;
  onPlacePlant: (bedId: string, x: number, y: number, plant: Plant) => void;
  onApplyProposal: (bedId: string, items: { plant: Plant; x: number; y: number }[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  vegetable: 'Vegetables',
  herb: 'Herbs',
  fruit: 'Fruits',
  flower: 'Flowers',
  tree: 'Trees',
  other: 'Other',
};

function catalogToPlant(c: CatalogPlant): Plant {
  const typeMap: Record<string, Plant['type']> = {
    vegetable: 'leafy',
    herb: 'herb',
    fruit: 'fruit',
    flower: 'flower',
    tree: 'other',
    other: 'other',
  };
  return {
    id: c.slug,
    name: c.common_name,
    type: typeMap[c.category] ?? 'other',
    color: 'bg-emerald-500',
    icon: c.image_url || '',
    spacing: c.spacing || 1,
    season: c.season || [],
  };
}

function buildGardenContext(garden: Garden, focusBedId?: string) {
  const beds = (garden.beds ?? []).map((b: GardenBed) => {
    const occupied = b.plants.map((p: PlantedCell) => ({ x: p.x, y: p.y, name: p.plant.name }));
    const free: { x: number; y: number }[] = [];
    for (let y = 0; y < b.height; y++) {
      for (let x = 0; x < b.width; x++) {
        if (!occupied.some((o) => o.x === x && o.y === y)) free.push({ x, y });
      }
    }
    return {
      id: b.id,
      name: b.name,
      width: b.width,
      height: b.height,
      occupied,
      free_cells_count: free.length,
      free: free.slice(0, 80),
    };
  });
  return { garden_name: garden.name, focus_bed_id: focusBedId ?? null, beds };
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  open,
  onOpenChange,
  garden,
  targetCell,
  onPlacePlant,
  onApplyProposal,
}) => {
  // Catalog state
  const [catalog, setCatalog] = useState<CatalogPlant[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // AI conversation state (only populated once user runs an AI query)
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiThreadRef = useRef<HTMLDivElement>(null);

  // Load catalog on open
  useEffect(() => {
    if (!open || catalog.length > 0) return;
    setCatalogLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from('plant_catalog')
        .select('slug, common_name, scientific_name, category, season, spacing, description, image_url')
        .order('common_name');
      if (error) {
        toast.error('Could not load plants');
      } else {
        setCatalog((data ?? []) as CatalogPlant[]);
      }
      setCatalogLoading(false);
    })();
  }, [open, catalog.length]);

  // Reset transient state when drawer closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setActiveCategory('all');
      setMessages([]);
    }
  }, [open]);

  // Auto-scroll AI thread on new messages
  useEffect(() => {
    aiThreadRef.current?.scrollTo({ top: aiThreadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, aiLoading]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((c) => set.add(c.category));
    return ['all', ...Array.from(set).sort()];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => {
      if (activeCategory !== 'all' && c.category !== activeCategory) return false;
      if (!q) return true;
      return (
        c.common_name.toLowerCase().includes(q) ||
        (c.scientific_name ?? '').toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [catalog, activeCategory, search]);

  const handlePickPlant = (c: CatalogPlant) => {
    if (!targetCell) {
      toast.info('Click an empty cell first to place this plant.');
      return;
    }
    onPlacePlant(targetCell.bedId, targetCell.x, targetCell.y, catalogToPlant(c));
    onOpenChange(false);
  };

  const askAI = async (text?: string) => {
    const content = (text ?? search).trim();
    if (!content || aiLoading) return;
    const newMessages: ChatMsg[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('garden-assistant', {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          garden_context: buildGardenContext(garden, targetCell?.bedId),
        },
      });

      if (error) {
        let friendly = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) friendly = body.error;
          }
        } catch { /* ignore */ }
        throw new Error(friendly);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      const widgets = (data?.widgets ?? {}) as Record<string, any>;
      let suggestions: CatalogPlant[] | undefined;
      let proposal: ChatMsg['proposal'];

      for (const [key, val] of Object.entries(widgets)) {
        if (key.startsWith('suggest_plants') && Array.isArray(val?.plants)) {
          suggestions = val.plants as CatalogPlant[];
          // Merge new suggestions into the local catalog so they appear in the list too
          setCatalog((prev) => {
            const bySlug = new Map(prev.map((p) => [p.slug, p]));
            (val.plants as CatalogPlant[]).forEach((p) => bySlug.set(p.slug, p));
            return Array.from(bySlug.values()).sort((a, b) =>
              a.common_name.localeCompare(b.common_name)
            );
          });
        }
        if (key.startsWith('propose_placement') && Array.isArray(val?.placements)) {
          proposal = {
            bed_id: val.bed_id,
            rationale: val.rationale ?? '',
            placements: val.placements as Placement[],
          };
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: (data?.reply as string) || '',
          suggestions,
          proposal,
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry — ${msg}` },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyProposal = async (
    proposal: NonNullable<ChatMsg['proposal']>,
    suggestions: CatalogPlant[] | undefined,
  ) => {
    const slugs = Array.from(new Set(proposal.placements.map((p) => p.plant_slug)));
    const bySlug = new Map<string, CatalogPlant>();
    catalog.forEach((s) => bySlug.set(s.slug, s));
    suggestions?.forEach((s) => bySlug.set(s.slug, s));
    messages.forEach((m) => m.suggestions?.forEach((s) => bySlug.set(s.slug, s)));
    const missing = slugs.filter((s) => !bySlug.has(s));
    if (missing.length) {
      const { data } = await (supabase as any)
        .from('plant_catalog')
        .select('*')
        .in('slug', missing);
      (data ?? []).forEach((row: CatalogPlant) => bySlug.set(row.slug, row));
    }
    const items = proposal.placements
      .map((p) => {
        const cat = bySlug.get(p.plant_slug);
        if (!cat) return null;
        return { plant: catalogToPlant(cat), x: p.x, y: p.y };
      })
      .filter((x): x is { plant: Plant; x: number; y: number } => x !== null);
    if (!items.length) {
      toast.error('Could not resolve plant images for that proposal.');
      return;
    }
    onApplyProposal(proposal.bed_id, items);
    onOpenChange(false);
  };

  const showAiThread = messages.length > 0 || aiLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
          <SheetTitle className="sr-only">Add plants</SheetTitle>
          <SheetDescription className="sr-only">
            {targetCell
              ? `Filling ${garden.beds?.find((b) => b.id === targetCell.bedId)?.name ?? 'cell'} — row ${targetCell.y + 1}, col ${targetCell.x + 1}`
              : 'Pick a plant or ask the assistant for ideas.'}
          </SheetDescription>

          {/* Search / Ask AI bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askAI();
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder="Search plants or ask the assistant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-24"
              disabled={aiLoading}
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={aiLoading || !search.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 gap-1"
            >
              {aiLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Ask AI
            </Button>
          </form>
        </SheetHeader>

        {/* Category chips */}
        <div className="border-b flex-shrink-0 py-3 px-4">
          <div className="flex gap-1.5 flex-wrap items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setSearch('');
                  setMessages([]);
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* AI conversation thread (above the catalog grid when active) */}
          {showAiThread && (
            <div ref={aiThreadRef} className="mb-4 space-y-3 pb-3 border-b">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm prose prose-sm dark:prose-invert prose-p:my-1',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                  </div>

                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 w-full mt-1">
                      {m.suggestions.map((c) => (
                        <Card
                          key={c.slug}
                          className="p-2 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500"
                          onClick={() => handlePickPlant(c)}
                        >
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="w-14 h-14 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                              {c.image_url ? (
                                <img src={c.image_url} alt={c.common_name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <Leaf className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs font-medium leading-tight line-clamp-2">{c.common_name}</div>
                            <div className="text-[10px] text-muted-foreground capitalize">{c.category}</div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {m.proposal && m.proposal.placements.length > 0 && (
                    <div className="w-full bg-accent/40 border rounded-lg p-3 mt-1">
                      <div className="text-xs font-medium mb-1">
                        Proposed: {m.proposal.placements.length} plant{m.proposal.placements.length > 1 ? 's' : ''} in{' '}
                        {garden.beds?.find((b) => b.id === m.proposal!.bed_id)?.name ?? 'bed'}
                      </div>
                      {m.proposal.rationale && (
                        <p className="text-xs text-muted-foreground mb-2">{m.proposal.rationale}</p>
                      )}
                      <ul className="text-xs mb-3 space-y-0.5">
                        {m.proposal.placements.map((p, idx) => (
                          <li key={idx}>
                            • {p.common_name} → row {p.y + 1}, col {p.x + 1}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApplyProposal(m.proposal!, m.suggestions)}>
                          <Check className="w-3 h-3 mr-1" /> Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setMessages((prev) =>
                              prev.map((x, j) => (j === i ? { ...x, proposal: undefined } : x))
                            )
                          }
                        >
                          <X className="w-3 h-3 mr-1" /> Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                </div>
              )}
            </div>
          )}

          {/* Catalog grid */}
          {catalogLoading && catalog.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading plants…
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No plants match your filter.
              {search.trim() && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => askAI()} disabled={aiLoading}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Ask AI for "{search.trim()}"
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredCatalog.map((c) => (
                <Card
                  key={c.slug}
                  className="p-2 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500"
                  onClick={() => handlePickPlant(c)}
                >
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-14 h-14 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.common_name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Leaf className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs font-medium leading-tight line-clamp-2">{c.common_name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{c.category}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};