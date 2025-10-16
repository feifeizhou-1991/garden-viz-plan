import React, { useState, useCallback, useRef } from 'react';
import { Garden, GardenBed, Plant, PlantedCell } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Edit, Pin, PinOff } from 'lucide-react';
import { toast } from 'sonner';

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
  onClearAllBeds
}) => {
  // Removed newBedSize state - using default 3x3 for new beds
  const [zoom, setZoom] = useState(1);
  const [draggedBed, setDraggedBed] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ distance: number; zoom: number } | null>(null);
  const [editingBed, setEditingBed] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize beds from plot if they don't exist (backward compatibility)
  const beds = garden.beds?.length > 0 ? garden.beds : [{
    id: 'main',
    name: 'Main Bed',
    width: garden.plot.width,
    height: garden.plot.height,
    plants: garden.plot.plants,
    x: 50, // Center the default bed
    y: 50
  }];

  const addNewBed = useCallback(() => {
    const newBed: GardenBed = {
      id: `bed-${Date.now()}`,
      name: `Bed ${beds.length + 1}`,
      width: 3,
      height: 3,
      plants: [],
      x: Math.random() * 600 + 50, // Random position within container
      y: Math.random() * 400 + 50,
      pinned: false
    };

    const updatedGarden = {
      ...garden,
      beds: [...beds, newBed]
    };

    onUpdateGarden(updatedGarden);
    toast.success(`Added new bed`);
  }, [beds, garden, onUpdateGarden]);

  const deleteBed = useCallback((bedId: string) => {
    if (beds.length === 1) {
      toast.error('Cannot delete the last bed');
      return;
    }

    const updatedBeds = beds.filter(bed => bed.id !== bedId);
    const updatedGarden = {
      ...garden,
      beds: updatedBeds
    };

    onUpdateGarden(updatedGarden);
    toast.success('Bed deleted');
  }, [beds, garden, onUpdateGarden]);

  const updateBed = useCallback((updatedBed: GardenBed) => {
    const updatedBeds = beds.map(bed => 
      bed.id === updatedBed.id ? updatedBed : bed
    );
    
    const updatedGarden = {
      ...garden,
      beds: updatedBeds,
      // Update main plot for backward compatibility
      plot: updatedBed.id === 'main' ? {
        width: updatedBed.width,
        height: updatedBed.height,
        plants: updatedBed.plants
      } : garden.plot
    };

    onUpdateGarden(updatedGarden);
  }, [beds, garden, onUpdateGarden]);

  const handlePlantCell = useCallback((bedId: string, x: number, y: number, plant: Plant) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const newPlants = bed.plants.filter(p => !(p.x === x && p.y === y));
    newPlants.push({ x, y, plant });

    updateBed({ ...bed, plants: newPlants });
    toast.success(`Planted ${plant.name}`);
  }, [beds, updateBed]);

  const handleRemoveCell = useCallback((bedId: string, x: number, y: number) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const plant = bed.plants.find(p => p.x === x && p.y === y);
    const newPlants = bed.plants.filter(p => !(p.x === x && p.y === y));

    updateBed({ ...bed, plants: newPlants });
    if (plant) {
      toast.success(`Removed ${plant.plant.name}`);
    }
  }, [beds, updateBed]);

  const toggleBedPin = useCallback((bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const updatedBed = { ...bed, pinned: !bed.pinned };
    updateBed(updatedBed);
    toast.success(`Bed ${updatedBed.pinned ? 'pinned' : 'unpinned'}`);
  }, [beds, updateBed]);

  // Pan functionality
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only start panning if not clicking on a bed or control
    const target = e.target as HTMLElement;
    if (target.closest('.bed-container, input, button, select, textarea, label, [data-no-drag]')) {
      return;
    }
    
    setIsPanning(true);
    if ('touches' in e) {
      const touch = e.touches[0];
      setPanStart({ x: touch.clientX, y: touch.clientY });
    } else {
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePanMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isPanning) return;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - panStart.x;
    const deltaY = clientY - panStart.y;

    setViewportOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setPanStart({ x: clientX, y: clientY });
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMovePlant = useCallback((bedId: string, fromX: number, fromY: number, toX: number, toY: number) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const plantToMove = bed.plants.find(p => p.x === fromX && p.y === fromY);
    if (!plantToMove) return;

    const newPlants = bed.plants.map(p => 
      p.x === fromX && p.y === fromY 
        ? { ...p, x: toX, y: toY }
        : p
    );

    updateBed({ ...bed, plants: newPlants });
    toast.success(`Moved ${plantToMove.plant.name}`);
  }, [beds, updateBed]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.1));

  // Touch and pinch-to-zoom handlers
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setTouchStart({ distance, zoom });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart) {
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / touchStart.distance;
      const newZoom = Math.max(0.1, Math.min(2, touchStart.zoom * scale));
      setZoom(newZoom);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Desktop trackpad pinch-to-zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = -e.deltaY * 0.01;
      setZoom(prev => Math.max(0.1, Math.min(2, prev + delta)));
    }
  };

  // Prevent browser-level pinch zoom inside the canvas (trackpads/Safari gestures)
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const wheelListener = (e: WheelEvent) => {
      if (e.ctrlKey || (e as any).metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY * 0.01;
        setZoom(prev => Math.max(0.1, Math.min(2, prev + delta)));
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('wheel', wheelListener, { passive: false });
    // Safari gesture events (non-standard) — cast to any to avoid TS issues
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

  // Bed dragging handlers
  const handleBedMouseDown = (e: React.MouseEvent, bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || bed.pinned) return; // Don't drag pinned beds
    
    const target = e.target as HTMLElement;
    if (target.closest('input,button,select,textarea,label,[data-no-drag]')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setDraggedBed(bedId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleBedTouchStart = (e: React.TouchEvent, bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || bed.pinned) return; // Don't drag pinned beds
    
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (target.closest('input,button,select,textarea,label,[data-no-drag]')) {
        return;
      }
      e.stopPropagation();
      setDraggedBed(bedId);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedBed) return;
    
    const bed = beds.find(b => b.id === draggedBed);
    if (!bed) return;

    const deltaX = (e.clientX - dragStart.x) / zoom;
    const deltaY = (e.clientY - dragStart.y) / zoom;

    // Allow beds to be placed anywhere within the container bounds
    const newX = Math.max(0, bed.x + deltaX);
    const newY = Math.max(0, bed.y + deltaY);

    updateBed({ ...bed, x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [draggedBed, beds, dragStart, zoom, updateBed]);

  const handleTouchMove2 = useCallback((e: TouchEvent) => {
    if (!draggedBed || e.touches.length !== 1) return;
    
    const bed = beds.find(b => b.id === draggedBed);
    if (!bed) return;

    const touch = e.touches[0];
    const deltaX = (touch.clientX - dragStart.x) / zoom;
    const deltaY = (touch.clientY - dragStart.y) / zoom;

    // Allow beds to be placed anywhere within the container bounds  
    const newX = Math.max(0, bed.x + deltaX);
    const newY = Math.max(0, bed.y + deltaY);

    updateBed({ ...bed, x: newX, y: newY });
    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, [draggedBed, beds, dragStart, zoom, updateBed]);

  const handleMouseUp = useCallback(() => {
    setDraggedBed(null);
  }, []);

  // Add global event listeners for both panning and bed dragging
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handlePanMove(e);
      handleMouseMove(e);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      handlePanMove(e);
      handleTouchMove2(e);
    };

    const handleGlobalEnd = () => {
      handlePanEnd();
      handleMouseUp();
    };

    if (isPanning || draggedBed) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchend', handleGlobalEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isPanning, draggedBed, handlePanMove, handleMouseMove, handleTouchMove2, handlePanEnd, handleMouseUp]);

  const totalPlants = beds.reduce((total, bed) => total + bed.plants.length, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Add Bed Button */}
          <div>
            <Button onClick={addNewBed} size="sm" className="flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Add Bed
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        {/* Unified Bed Container */}
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
              minWidth: '800px',
              minHeight: '600px'
            }}
          >
            {beds.map((bed) => (
              <div
                key={bed.id}
                className={`bed-container absolute bg-background border border-border rounded-lg p-4 shadow-sm select-none ${bed.pinned ? 'cursor-default' : 'cursor-move'}`}
                style={{
                  left: `${bed.x}px`,
                  top: `${bed.y}px`,
                }}
                onMouseDown={bed.pinned ? undefined : (e) => handleBedMouseDown(e, bed.id)}
                onTouchStart={bed.pinned ? undefined : (e) => handleBedTouchStart(e, bed.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  {editingBed === bed.id ? (
                    <div className="flex items-center gap-2">
                      <div>
                        <Input
                          type="number"
                          min="3"
                          max="20"
                          value={bed.width}
                          onChange={(e) => {
                            const newWidth = parseInt(e.target.value) || 3;
                            updateBed({ ...bed, width: newWidth });
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="w-12 h-6 text-xs text-center p-1"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">×</span>
                      <div>
                        <Input
                          type="number"
                          min="3"
                          max="20"
                          value={bed.height}
                          onChange={(e) => {
                            const newHeight = parseInt(e.target.value) || 3;
                            updateBed({ ...bed, height: newHeight });
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="w-12 h-6 text-xs text-center p-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-foreground">
                      {bed.name} ({bed.width}×{bed.height})
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBedPin(bed.id)}
                      className={`h-6 w-6 p-0 ${bed.pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      title={bed.pinned ? 'Unpin bed' : 'Pin bed'}
                    >
                      {bed.pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBed(editingBed === bed.id ? null : bed.id)}
                      className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    {beds.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBed(bed.id)}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
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