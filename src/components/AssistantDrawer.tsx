import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Garden, GardenBed, Plant, PlantedCell } from '@/types/garden';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Send, Sparkles, Check, X } from 'lucide-react';
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

function catalogToPlant(c: CatalogPlant): Plant {
  // Map catalog category to existing Plant.type for legacy compatibility
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
      // Cap to keep payload small
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
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [didSeed, setDidSeed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    if (didSeed) return;
    setMessages([
      {
        role: 'assistant',
        content: targetCell
          ? `Hi! I can help you fill **${garden.beds?.find((b) => b.id === targetCell.bedId)?.name ?? 'this bed'}**. Tell me what you'd like to grow — e.g. *"some tomatoes and basil"* or *"shade-loving herbs"*.`
          : `Hi! I'm your garden assistant. Ask me for plant ideas or tell me what to plant where.`,
      },
    ]);
    setDidSeed(true);
  }, [open, didSeed, targetCell, garden.beds]);

  // Reset seed flag when drawer closes so next open re-seeds with fresh context
  useEffect(() => {
    if (!open) setDidSeed(false);
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const newMessages: ChatMsg[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('garden-assistant', {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          garden_context: buildGardenContext(garden, targetCell?.bedId),
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const widgets = (data?.widgets ?? {}) as Record<string, any>;
      let suggestions: CatalogPlant[] | undefined;
      let proposal: ChatMsg['proposal'];

      for (const [key, val] of Object.entries(widgets)) {
        if (key.startsWith('suggest_plants') && Array.isArray(val?.plants)) {
          suggestions = val.plants as CatalogPlant[];
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
      setLoading(false);
    }
  };

  const handlePickSuggestion = (c: CatalogPlant) => {
    if (!targetCell) {
      toast.info('Click an empty cell first to place this plant.');
      return;
    }
    onPlacePlant(targetCell.bedId, targetCell.x, targetCell.y, catalogToPlant(c));
    onOpenChange(false);
  };

  const handleApplyProposal = async (proposal: NonNullable<ChatMsg['proposal']>, suggestions: CatalogPlant[] | undefined) => {
    // We need a Plant object per slug. Use the latest suggestions message,
    // and fall back to fetching from the catalog table.
    const slugs = Array.from(new Set(proposal.placements.map((p) => p.plant_slug)));
    const fromMsg = new Map<string, CatalogPlant>();
    suggestions?.forEach((s) => fromMsg.set(s.slug, s));
    // Also scan all prior messages for suggestions
    messages.forEach((m) => m.suggestions?.forEach((s) => fromMsg.set(s.slug, s)));
    const missing = slugs.filter((s) => !fromMsg.has(s));
    if (missing.length) {
      const { data } = await (supabase as any)
        .from('plant_catalog')
        .select('*')
        .in('slug', missing);
      (data ?? []).forEach((row: CatalogPlant) => fromMsg.set(row.slug, row));
    }
    const items = proposal.placements
      .map((p) => {
        const cat = fromMsg.get(p.plant_slug);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Garden Assistant
          </SheetTitle>
          {targetCell && (
            <SheetDescription>
              Filling {garden.beds?.find((b) => b.id === targetCell.bedId)?.name ?? 'cell'} — row {targetCell.y + 1}, col {targetCell.x + 1}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Message thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
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

              {/* Plant suggestion cards */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="grid grid-cols-2 gap-2 w-full mt-1">
                  {m.suggestions.map((c) => (
                    <Card
                      key={c.slug}
                      className="p-2 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500"
                      onClick={() => handlePickSuggestion(c)}
                    >
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-14 h-14 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                          {c.image_url ? (
                            <img src={c.image_url} alt={c.common_name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs font-medium leading-tight line-clamp-2">{c.common_name}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{c.category}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Placement proposal */}
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
                    <Button
                      size="sm"
                      onClick={() => handleApplyProposal(m.proposal!, m.suggestions)}
                    >
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
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t p-3 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Ask for plants or where to put them…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Suggest spring herbs', 'Plant 3 tomatoes here', 'What grows in shade?'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={loading}
                className="px-2 py-0.5 rounded-full text-[11px] border border-border bg-background hover:bg-muted text-muted-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};