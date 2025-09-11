import React, { useState, useCallback } from 'react';
import { Plant, PlantedCell } from '../types/garden';
import { GardenGrid } from './GardenGrid';
import { PlantSelector } from './PlantSelector';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Trash2, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export const GardenPlanner: React.FC = () => {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [plants, setPlants] = useState<PlantedCell[]>([]);
  const [gridSize] = useState({ width: 12, height: 8 });

  const handlePlantCell = useCallback((x: number, y: number, plant: Plant) => {
    setPlants(prev => {
      // Remove any existing plant at this location
      const filtered = prev.filter(p => !(p.x === x && p.y === y));
      // Add the new plant
      return [...filtered, { x, y, plant }];
    });
    
    toast.success(`Planted ${plant.name} at (${x + 1}, ${y + 1})`);
  }, []);

  const handleRemoveCell = useCallback((x: number, y: number) => {
    setPlants(prev => {
      const plant = prev.find(p => p.x === x && p.y === y);
      if (plant) {
        toast.success(`Removed ${plant.plant.name} from (${x + 1}, ${y + 1})`);
      }
      return prev.filter(p => !(p.x === x && p.y === y));
    });
  }, []);

  const clearGarden = useCallback(() => {
    setPlants([]);
    setSelectedPlant(null);
    toast.success('Garden cleared!');
  }, []);

  const exportPlan = useCallback(() => {
    const planData = {
      gridSize,
      plants: plants.map(p => ({
        position: [p.x, p.y],
        plant: p.plant.name,
        type: p.plant.type
      }))
    };
    
    const dataStr = JSON.stringify(planData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'garden-plan.json';
    link.click();
    
    toast.success('Garden plan exported!');
  }, [gridSize, plants]);

  const getPlantTypeCounts = () => {
    const counts: Record<string, number> = {};
    plants.forEach(p => {
      counts[p.plant.type] = (counts[p.plant.type] || 0) + 1;
    });
    return counts;
  };

  const typeCounts = getPlantTypeCounts();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">🌿 Garden Planner</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Design your perfect vegetable garden layout with visual planning tools
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl">Garden Layout ({gridSize.width} × {gridSize.height})</CardTitle>
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
                      Select a plant above and click on the grid to start planning!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};