import React, { useState, useCallback, useEffect } from 'react';
import { Plant, PlantedCell, Garden } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { PlantSelector } from './PlantSelector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Trash2, Download, RotateCcw, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';

interface GardenPlannerProps {
  garden: Garden;
  onUpdateGarden: (garden: Garden) => void;
}

export const GardenPlanner: React.FC<GardenPlannerProps> = ({ garden, onUpdateGarden }) => {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [plants, setPlants] = useState<PlantedCell[]>(garden.plot.plants);
  const [gridSize, setGridSize] = useState({ width: garden.plot.width, height: garden.plot.height });
  const [editingGrid, setEditingGrid] = useState(false);

  // Update local state when garden changes
  useEffect(() => {
    setPlants(garden.plot.plants);
    setGridSize({ width: garden.plot.width, height: garden.plot.height });
  }, [garden.plot.plants, garden.plot.width, garden.plot.height]);

  const updateGarden = useCallback((newPlants: PlantedCell[], newWidth?: number, newHeight?: number) => {
    const updatedGarden = {
      ...garden,
      plot: {
        ...garden.plot,
        width: newWidth ?? gridSize.width,
        height: newHeight ?? gridSize.height,
        plants: newPlants
      }
    };
    onUpdateGarden(updatedGarden);
  }, [garden, onUpdateGarden, gridSize]);

  const updateGardenPlants = useCallback((newPlants: PlantedCell[]) => {
    setPlants(newPlants);
    updateGarden(newPlants);
  }, [updateGarden]);

  const handleGridSizeChange = useCallback((newWidth: number, newHeight: number) => {
    // Filter out plants that would be outside the new grid bounds
    const validPlants = plants.filter(p => p.x < newWidth && p.y < newHeight);
    const removedCount = plants.length - validPlants.length;
    
    setGridSize({ width: newWidth, height: newHeight });
    setPlants(validPlants);
    updateGarden(validPlants, newWidth, newHeight);
    setEditingGrid(false);
    
    if (removedCount > 0) {
      toast.warning(`Removed ${removedCount} plant${removedCount > 1 ? 's' : ''} that were outside the new grid size`);
    }
    toast.success(`Grid resized to ${newWidth}×${newHeight}`);
  }, [plants, updateGarden]);

  const cancelGridEdit = useCallback(() => {
    setGridSize({ width: garden.plot.width, height: garden.plot.height });
    setEditingGrid(false);
  }, [garden.plot.width, garden.plot.height]);

  const handlePlantCell = useCallback((x: number, y: number, plant: Plant) => {
    const newPlants = plants.filter(p => !(p.x === x && p.y === y));
    newPlants.push({ x, y, plant });
    updateGardenPlants(newPlants);
    
    toast.success(`Planted ${plant.name} at (${x + 1}, ${y + 1})`);
  }, [plants, updateGardenPlants]);

  const handleRemoveCell = useCallback((x: number, y: number) => {
    const plant = plants.find(p => p.x === x && p.y === y);
    if (plant) {
      toast.success(`Removed ${plant.plant.name} from (${x + 1}, ${y + 1})`);
    }
    const newPlants = plants.filter(p => !(p.x === x && p.y === y));
    updateGardenPlants(newPlants);
  }, [plants, updateGardenPlants]);

  const handleMovePlant = useCallback((fromX: number, fromY: number, toX: number, toY: number) => {
    const plantToMove = plants.find(p => p.x === fromX && p.y === fromY);
    if (!plantToMove) return;

    const newPlants = plants.map(p => 
      p.x === fromX && p.y === fromY 
        ? { ...p, x: toX, y: toY }
        : p
    );
    updateGardenPlants(newPlants);
    toast.success(`Moved ${plantToMove.plant.name} to (${toX + 1}, ${toY + 1})`);
  }, [plants, updateGardenPlants]);

  const clearGarden = useCallback(() => {
    updateGardenPlants([]);
    setSelectedPlant(null);
    toast.success('Garden cleared!');
  }, [updateGardenPlants]);

  const exportPlan = useCallback(() => {
    const planData = {
      gardenName: garden.name,
      gridSize,
      plants: plants.map(p => ({
        position: [p.x, p.y],
        plant: p.plant.name,
        type: p.plant.type
      })),
      createdAt: garden.createdAt
    };
    
    const dataStr = JSON.stringify(planData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${garden.name.toLowerCase().replace(/\s+/g, '-')}-plan.json`;
    link.click();
    
    toast.success(`${garden.name} plan exported!`);
  }, [garden, gridSize, plants]);

  const getPlantTypeCounts = () => {
    const counts: Record<string, number> = {};
    plants.forEach(p => {
      counts[p.plant.type] = (counts[p.plant.type] || 0) + 1;
    });
    return counts;
  };

  const typeCounts = getPlantTypeCounts();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl">{garden.name}</CardTitle>
            {!editingGrid ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">({gridSize.width} × {gridSize.height})</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingGrid(true)}
                  className="flex items-center gap-1"
                >
                  <Grid3x3 className="w-3 h-3" />
                  Edit Size
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="grid-width" className="text-xs">W:</Label>
                  <Input
                    id="grid-width"
                    type="number"
                    min="3"
                    max="20"
                    value={gridSize.width}
                    onChange={(e) => setGridSize(prev => ({ ...prev, width: parseInt(e.target.value) || 3 }))}
                    className="w-16 h-8"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Label htmlFor="grid-height" className="text-xs">H:</Label>
                  <Input
                    id="grid-height"
                    type="number"
                    min="3"
                    max="20"
                    value={gridSize.height}
                    onChange={(e) => setGridSize(prev => ({ ...prev, height: parseInt(e.target.value) || 3 }))}
                    className="w-16 h-8"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGridSizeChange(gridSize.width, gridSize.height)}
                  disabled={gridSize.width === garden.plot.width && gridSize.height === garden.plot.height}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelGridEdit}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearGarden}
              className="flex items-center gap-2"
              disabled={plants.length === 0}
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
            <Button
              onClick={exportPlan}
              className="flex items-center gap-2"
              disabled={plants.length === 0}
            >
              <Download className="w-4 h-4" />
              Export Plan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Full Width Garden Layout */}
        <div className="flex flex-col lg:flex-row gap-8 h-full">
          {/* Garden Grid - Left Side */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-center">
              <GardenGrid
                width={gridSize.width}
                height={gridSize.height}
                selectedPlant={selectedPlant}
                plants={plants}
                onPlantCell={handlePlantCell}
                onRemoveCell={handleRemoveCell}
                onMovePlant={handleMovePlant}
              />
            </div>
            
            {/* Stats Below Grid */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{plants.length}</div>
                    <div className="text-sm text-muted-foreground">Total Plants</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {((plants.length / (gridSize.width * gridSize.height)) * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Grid Usage</div>
                  </div>
                  {Object.entries(typeCounts).slice(0, 2).map(([type, count]) => (
                    <div key={type}>
                      <div className="text-2xl font-bold text-primary">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">{type}</div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(typeCounts).length > 2 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-4 justify-center">
                      {Object.entries(typeCounts).slice(2).map(([type, count]) => (
                        <div key={type} className="text-sm">
                          <span className="capitalize text-muted-foreground">{type}:</span>
                          <span className="ml-1 font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Plant Selector - Right Side */}
          <div className="w-full lg:w-80 xl:w-96">
            <PlantSelector
              selectedPlant={selectedPlant}
              onSelectPlant={setSelectedPlant}
            />
            
            {plants.length === 0 && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="text-center text-sm text-muted-foreground">
                    Select a plant and click on the grid to start planning, or drag plants directly onto the grid!
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};