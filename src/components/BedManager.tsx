import React, { useState, useCallback } from 'react';
import { Garden, GardenBed, Plant, PlantedCell } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface BedManagerProps {
  garden: Garden;
  selectedPlant: Plant | null;
  onUpdateGarden: (garden: Garden) => void;
}

export const BedManager: React.FC<BedManagerProps> = ({
  garden,
  selectedPlant,
  onUpdateGarden
}) => {
  const [newBedSize, setNewBedSize] = useState({ width: 8, height: 6 });
  const [zoom, setZoom] = useState(1);

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
      width: newBedSize.width,
      height: newBedSize.height,
      plants: [],
      x: Math.random() * 200 + 100, // Random position
      y: Math.random() * 200 + 100
    };

    const updatedGarden = {
      ...garden,
      beds: [...beds, newBed]
    };

    onUpdateGarden(updatedGarden);
    toast.success(`Added new bed`);
  }, [beds, newBedSize, garden, onUpdateGarden]);

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
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  const totalPlants = beds.reduce((total, bed) => total + bed.plants.length, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Garden Beds ({totalPlants} plants)</CardTitle>
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
          </div>
        </div>
        
        {/* Add Bed Controls */}
        <div className="flex items-end gap-4 pt-4">
          <div>
            <Label htmlFor="bed-width">Width</Label>
            <Input
              id="bed-width"
              type="number"
              min="3"
              max="20"
              value={newBedSize.width}
              onChange={(e) => setNewBedSize(prev => ({ ...prev, width: parseInt(e.target.value) || 3 }))}
              className="w-20"
            />
          </div>
          <div>
            <Label htmlFor="bed-height">Height</Label>
            <Input
              id="bed-height"
              type="number"
              min="3"
              max="20"
              value={newBedSize.height}
              onChange={(e) => setNewBedSize(prev => ({ ...prev, height: parseInt(e.target.value) || 3 }))}
              className="w-20"
            />
          </div>
          <Button onClick={addNewBed} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Bed
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="h-full">
        {/* Unified Bed Container */}
        <div 
          className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-auto bg-muted/5"
          style={{ height: '600px' }}
        >
          <div 
            className="relative w-full h-full"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              minWidth: '800px',
              minHeight: '600px'
            }}
          >
            {beds.map((bed) => (
              <div
                key={bed.id}
                className="absolute bg-background border border-border rounded-lg p-4 shadow-sm"
                style={{
                  left: `${bed.x}px`,
                  top: `${bed.y}px`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {bed.width} × {bed.height}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({bed.plants.length} plants)
                    </span>
                  </div>
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