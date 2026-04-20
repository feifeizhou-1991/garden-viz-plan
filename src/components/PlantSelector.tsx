import React, { useState, useEffect, useRef } from 'react';
import { Plant } from '../types/garden';
import { cn } from '../lib/utils';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Search, Loader2, Leaf } from 'lucide-react';

interface PlantSelectorProps {
  selectedPlant: Plant | null;
  onSelectPlant: (plant: Plant | null) => void;
}

interface WikiResult {
  pageId: number;
  title: string;
  thumbnail: string | null;
}

const FALLBACK_PLANTS = [
  'Tomato', 'Lettuce', 'Carrot', 'Basil', 'Bell pepper', 'Spinach',
  'Radish', 'Cucumber', 'Onion', 'Parsley', 'Strawberry', 'Sunflower',
  'Rose', 'Lavender', 'Mint', 'Rosemary',
];

/**
 * Searches the English Wikipedia for plant pages with thumbnails.
 * Uses generator=prefixsearch (typeahead) + pageimages in a single call.
 * No API key required, fully CORS-enabled via origin=*.
 */
async function searchWikipedia(query: string, signal: AbortSignal): Promise<WikiResult[]> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    generator: 'prefixsearch',
    gpssearch: query,
    gpslimit: '20',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '200',
    format: 'json',
    origin: '*',
  }).toString();

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return [];

  return Object.values(pages as Record<string, {
    pageid: number;
    title: string;
    index?: number;
    thumbnail?: { source: string };
  }>)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => ({
      pageId: p.pageid,
      title: p.title,
      thumbnail: p.thumbnail?.source ?? null,
    }));
}

function wikiResultToPlant(r: WikiResult): Plant {
  return {
    id: `wiki-${r.pageId}`,
    name: r.title,
    type: 'other',
    color: 'bg-emerald-500',
    icon:
      r.thumbnail ||
      // tiny inline svg leaf fallback
      'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2316a34a"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>'
        ),
    spacing: 1,
    season: [],
  };
}

export const PlantSelector: React.FC<PlantSelectorProps> = ({
  selectedPlant,
  onSelectPlant,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<WikiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Initial suggestions when no query
  useEffect(() => {
    if (searchTerm.trim()) return;
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all(
      FALLBACK_PLANTS.map((name) =>
        searchWikipedia(name, new AbortController().signal)
          .then((r) => r[0])
          .catch(() => null)
      )
    ).then((items) => {
      if (!active) return;
      setResults(items.filter((x): x is WikiResult => !!x));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await searchWikipedia(term, controller.signal);
        setResults(items);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('Could not reach Wikipedia. Check your connection.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
        <Leaf className="w-5 h-5 text-primary" />
        Plant Selection
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Search any plant from Wikipedia
      </p>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search plants on Wikipedia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto pr-2">
        {error && (
          <p className="text-sm text-destructive py-2">{error}</p>
        )}
        {!loading && !error && results.length === 0 && searchTerm.trim() && (
          <p className="text-sm text-muted-foreground py-2">
            No results for "{searchTerm}".
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {results.map((r) => {
            const isSelected = selectedPlant?.id === `wiki-${r.pageId}`;
            return (
              <Card
                key={r.pageId}
                className={cn(
                  'p-3 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-emerald-500 bg-emerald-500/5',
                  isSelected
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'hover:scale-[1.02]'
                )}
                onClick={() =>
                  onSelectPlant(isSelected ? null : wikiResultToPlant(r))
                }
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                    {r.thumbnail ? (
                      <img
                        src={r.thumbnail}
                        alt={r.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Leaf className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-card-foreground line-clamp-2 leading-tight">
                    {r.title}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPlant && (
        <div className="mt-4 p-3 bg-secondary rounded-lg border">
          <p className="text-sm text-secondary-foreground flex items-center gap-2">
            <img
              src={selectedPlant.icon}
              alt={selectedPlant.name}
              className="w-6 h-6 object-cover rounded"
            />
            <span className="font-medium truncate">{selectedPlant.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};