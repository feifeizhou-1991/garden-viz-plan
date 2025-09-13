import React, { useState, useCallback } from 'react';
import { Garden, GardenBed, Plant, PlantedCell } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Edit3 } from 'lucide-react';
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
  const [editingBed, setEditingBed] = useState<string | null>(null);
  const [newBedName, setNewBedName] = useState('');
  const [newBedSize, setNewBedSize] = useState({ width: 8, height: 6 });

  // Initialize beds from plot if they don't exist (backward compatibility)
  const beds = garden.beds?.length > 0 ? garden.beds : [{
    id: 'main',
    name: 'Main Bed',
    width: garden.plot.width,
    height: garden.plot.height,
    plants: garden.plot.plants,
    x: 0,
    y: 0
  }];

  const addNewBed = useCallback(() => {
    const bedName = newBedName.trim() || `Bed ${beds.length + 1}`;
    const newBed: GardenBed = {
      id: `bed-${Date.now()}`,
      name: bedName,
      width: newBedSize.width,
      height: newBedSize.height,
      plants: [],
      x: 0,
      y: 0
    };

    const updatedGarden = {
      ...garden,
      beds: [...beds, newBed]
    };

    onUpdateGarden(updatedGarden);
    setNewBedName('');
    toast.success(`Added new bed: ${bedName}`);
  }, [beds, newBedName, newBedSize, garden, onUpdateGarden]);

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
    toast.success(`Planted ${plant.name} in ${bed.name}`);
  }, [beds, updateBed]);

  const handleRemoveCell = useCallback((bedId: string, x: number, y: number) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const plant = bed.plants.find(p => p.x === x && p.y === y);
    const newPlants = bed.plants.filter(p => !(p.x === x && p.y === y));

    updateBed({ ...bed, plants: newPlants });
    if (plant) {
      toast.success(`Removed ${plant.plant.name} from ${bed.name}`);
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
    toast.success(`Moved ${plantToMove.plant.name} in ${bed.name}`);
  }, [beds, updateBed]);

  const updateBedName = useCallback((bedId: string, newName: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    updateBed({ ...bed, name: newName });
    setEditingBed(null);
    toast.success('Bed renamed');
  }, [beds, updateBed]);

  return (
    <div className="space-y-8">
      {/* Add New Bed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Garden Beds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <Label htmlFor="bed-name">Bed Name</Label>
              <Input
                id="bed-name"
                value={newBedName}
                onChange={(e) => setNewBedName(e.target.value)}
                placeholder={`Bed ${beds.length + 1}`}
              />
            </div>
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
        </CardContent>
      </Card>

      {/* Render Beds */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {beds.map((bed) => (
          <Card key={bed.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingBed === bed.id ? (
                    <Input
                      value={bed.name}
                      onChange={(e) => updateBed({ ...bed, name: e.target.value })}
                      onBlur={() => setEditingBed(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingBed(null);
                        }
                      }}
                      className="w-48"
                      autoFocus
                    />
                  ) : (
                    <>
                      <CardTitle className="text-lg">{bed.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingBed(bed.id)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">
                    ({bed.width} × {bed.height})
                  </span>
                </div>
                {beds.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBed(bed.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
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
              <div className="mt-4 text-center">
                <div className="flex justify-center gap-6 text-sm">
                  <span>
                    <span className="font-medium">{bed.plants.length}</span> plants
                  </span>
                  <span>
                    <span className="font-medium">
                      {((bed.plants.length / (bed.width * bed.height)) * 100).toFixed(0)}%
                    </span> filled
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};