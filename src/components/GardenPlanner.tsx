import React, { useState, useCallback, useEffect } from 'react';
import { Plant, PlantedCell, Garden } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { PlantSelector } from './PlantSelector';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Trash2, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface GardenPlannerProps {
  garden: Garden;
  onUpdateGarden: (garden: Garden) => void;
}

export const GardenPlanner: React.FC<GardenPlannerProps> = ({ garden, onUpdateGarden }) => {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [plants, setPlants] = useState<PlantedCell[]>(garden.plot.plants);
  const gridSize = { width: garden.plot.width, height: garden.plot.height };

  // Update local plants when garden changes
  useEffect(() => {
    setPlants(garden.plot.plants);
  }, [garden.plot.plants]);

  const updateGardenPlants = useCallback((newPlants: PlantedCell[]) => {
    setPlants(newPlants);
    onUpdateGarden({
      ...garden,
      plot: {
        ...garden.plot,
        plants: newPlants
      }
    });
  }, [garden, onUpdateGarden]);

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
          <CardTitle className="text-xl">{garden.name} ({gridSize.width} × {gridSize.height})</CardTitle>
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
        {/* Plant Selector */}
        <PlantSelector
          selectedPlant={selectedPlant}
          onSelectPlant={setSelectedPlant}
        />
        
        <Separator />
        
        {/* Garden Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex justify-center">
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
          
          {/* Stats Panel */}
          <Card className="w-full lg:w-80">
            <CardHeader>
              <CardTitle className="text-lg">Garden Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Plants:</span>
                  <span className="font-medium">{plants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Grid Usage:</span>
                  <span className="font-medium">
                    {((plants.length / (gridSize.width * gridSize.height)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Plant Types:</h4>
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{type}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
              
              {plants.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Select a plant above and click on the grid to start planning, or drag plants directly onto the grid!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};