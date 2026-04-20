import React, { useState, useCallback, useRef } from 'react';
import { Garden, GardenBed, Plant } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { FIXED_BED_LAYOUT, FIXED_CANVAS_WIDTH, FIXED_CANVAS_HEIGHT } from '@/data/fixedBedLayout';

interface BedManagerProps {
  garden: Garden;
  selectedPlant: Plant | null;
  onUpdateGarden: (garden: Garden) => void;
  onClearAllBeds: () => void;
}

export const BedManager: React.FC<BedManagerProps> = ({
  garden,
  selectedPlant,
  onUpdateGarden,
  onClearAllBeds,
}) => {
  const [zoom, setZoom] = useState(0.7);
  const [touchStart, setTouchStart] = useState<{ distance: number; zoom: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve beds in the order of the fixed layout.
  // If a bed isn't yet in the database, render a placeholder using the template.
  const beds: GardenBed[] = FIXED_BED_LAYOUT.map((tpl) => {
    const found = garden.beds?.find((b) => b.name === tpl.name);
    return (
      found ?? {
        id: `tpl-${tpl.name}`,
        name: tpl.name,
        width: tpl.width,
        height: tpl.height,
        x: tpl.x,
        y: tpl.y,
        pinned: true,
        plants: [],
      }
    );
  });

  const updateBed = useCallback(
    (updatedBed: GardenBed) => {
      const sourceBeds = garden.beds || [];
      const exists = sourceBeds.some((b) => b.id === updatedBed.id);
      const updatedBeds = exists
        ? sourceBeds.map((b) => (b.id === updatedBed.id ? updatedBed : b))
        : [...sourceBeds, updatedBed];

      onUpdateGarden({ ...garden, beds: updatedBeds });
    },
    [garden, onUpdateGarden]
  );

  const handlePlantCell = useCallback(
    (bedId: string, x: number, y: number, plant: Plant) => {
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return;
      const newPlants = bed.plants.filter((p) => !(p.x === x && p.y === y));
      newPlants.push({ x, y, plant });
      updateBed({ ...bed, plants: newPlants });
      toast.success(`Planted ${plant.name}`);
    },
    [beds, updateBed]
  );

  const handleRemoveCell = useCallback(
    (bedId: string, x: number, y: number) => {
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return;
      const plant = bed.plants.find((p) => p.x === x && p.y === y);
      const newPlants = bed.plants.filter((p) => !(p.x === x && p.y === y));
      updateBed({ ...bed, plants: newPlants });
      if (plant) toast.success(`Removed ${plant.plant.name}`);
    },
    [beds, updateBed]
  );

  const handleMovePlant = useCallback(
    (bedId: string, fromX: number, fromY: number, toX: number, toY: number) => {
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return;
      const plantToMove = bed.plants.find((p) => p.x === fromX && p.y === fromY);
      if (!plantToMove) return;
      const newPlants = bed.plants.map((p) =>
        p.x === fromX && p.y === fromY ? { ...p, x: toX, y: toY } : p
      );
      updateBed({ ...bed, plants: newPlants });
      toast.success(`Moved ${plantToMove.plant.name}`);
    },
    [beds, updateBed]
  );

  // Pan
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.bed-container, input, button, select, textarea, label, [data-no-drag]')) return;
    setIsPanning(true);
    if ('touches' in e) {
      const t = e.touches[0];
      setPanStart({ x: t.clientX, y: t.clientY });
    } else {
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePanMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isPanning) return;
      let clientX: number, clientY: number;
      if ('touches' in e) {
        const t = (e as TouchEvent).touches[0];
        clientX = t.clientX;
        clientY = t.clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      const dx = clientX - panStart.x;
      const dy = clientY - panStart.y;
      setViewportOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: clientX, y: clientY });
    },
    [isPanning, panStart]
  );

  const handlePanEnd = useCallback(() => setIsPanning(false), []);

  // Zoom
  const handleZoomIn = () => setZoom((p) => Math.min(p + 0.1, 2));
  const handleZoomOut = () => setZoom((p) => Math.max(p - 0.1, 0.2));

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setTouchStart({ distance: getTouchDistance(e.touches), zoom });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart) {
      const cur = getTouchDistance(e.touches);
      const scale = cur / touchStart.distance;
      setZoom(Math.max(0.2, Math.min(2, touchStart.zoom * scale)));
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => setTouchStart(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      setZoom((p) => Math.max(0.2, Math.min(2, p + -e.deltaY * 0.01)));
    }
  };

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const wheelListener = (e: WheelEvent) => {
      if (e.ctrlKey || (e as any).metaKey) {
        e.preventDefault();
        e.stopPropagation();
        setZoom((p) => Math.max(0.2, Math.min(2, p + -e.deltaY * 0.01)));
      }
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', wheelListener, { passive: false });
    (el as any).addEventListener('gesturestart', preventGesture, { passive: false });
    (el as any).addEventListener('gesturechange', preventGesture, { passive: false });
    (el as any).addEventListener('gestureend', preventGesture, { passive: false });
    return () => {
      el.removeEventListener('wheel', wheelListener as EventListener);
      (el as any).removeEventListener('gesturestart', preventGesture as EventListener);
      (el as any).removeEventListener('gesturechange', preventGesture as EventListener);
      (el as any).removeEventListener('gestureend', preventGesture as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (!isPanning) return;
    const move = (e: MouseEvent | TouchEvent) => handlePanMove(e);
    const end = () => handlePanEnd();
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchend', end);
    };
  }, [isPanning, handlePanMove, handlePanEnd]);

  const totalPlants = beds.reduce((t, b) => t + b.plants.length, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllBeds}
              disabled={totalPlants === 0}
              className="ml-2"
              title="Clear all plants"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <div
          className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5 h-full cursor-grab active:cursor-grabbing touch-none overscroll-contain"
          onMouseDown={handlePanStart}
          onTouchStart={handlePanStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onWheelCapture={handleWheel}
          ref={containerRef}
          style={{ touchAction: 'none' }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transform: `scale(${zoom}) translate(${viewportOffset.x / zoom}px, ${viewportOffset.y / zoom}px)`,
              transformOrigin: 'top left',
              minWidth: `${FIXED_CANVAS_WIDTH}px`,
              minHeight: `${FIXED_CANVAS_HEIGHT}px`,
            }}
          >
            {beds.map((bed) => (
              <div
                key={bed.id}
                className="bed-container absolute bg-background border border-border rounded-lg p-4 shadow-sm select-none cursor-default"
                style={{ left: `${bed.x}px`, top: `${bed.y}px` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-foreground">
                    {bed.name} ({bed.width}×{bed.height})
                  </div>
                </div>
                <GardenGrid
                  width={bed.width}
                  height={bed.height}
                  selectedPlant={selectedPlant}
                  plants={bed.plants}
                  onPlantCell={(x, y, plant) => handlePlantCell(bed.id, x, y, plant)}
                  onRemoveCell={(x, y) => handleRemoveCell(bed.id, x, y)}
                  onMovePlant={(fromX, fromY, toX, toY) => handleMovePlant(bed.id, fromX, fromY, toX, toY)}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};