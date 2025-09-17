import React, { useState, useCallback, useEffect } from 'react';
import { Plant, PlantedCell, Garden } from '../types/garden';
import { BedManager } from './BedManager';
import { PlantSelector } from './PlantSelector';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface GardenPlannerProps {
  garden: Garden;
  onUpdateGarden: (garden: Garden) => void;
}

export const GardenPlanner: React.FC<GardenPlannerProps> = ({ garden, onUpdateGarden }) => {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // Initialize beds if they don't exist (backward compatibility)
  const ensureGardenHasBeds = useCallback((gardenToUpdate: Garden) => {
    if (!gardenToUpdate.beds || gardenToUpdate.beds.length === 0) {
      return {
        ...gardenToUpdate,
        beds: [{
          id: 'main',
          name: 'Main Bed',
          width: gardenToUpdate.plot.width,
          height: gardenToUpdate.plot.height,
          plants: gardenToUpdate.plot.plants,
          x: 0,
          y: 0
        }]
      };
    }
    return gardenToUpdate;
  }, []);

  const handleUpdateGarden = useCallback((updatedGarden: Garden) => {
    const gardenWithBeds = ensureGardenHasBeds(updatedGarden);
    onUpdateGarden(gardenWithBeds);
  }, [onUpdateGarden, ensureGardenHasBeds]);

  const getAllPlants = useCallback(() => {
    const beds = garden.beds?.length > 0 ? garden.beds : [{
      id: 'main',
      name: 'Main Bed',
      width: garden.plot.width,
      height: garden.plot.height,
      plants: garden.plot.plants,
      x: 0,
      y: 0
    }];
    
    return beds.reduce((allPlants, bed) => [...allPlants, ...bed.plants], [] as PlantedCell[]);
  }, [garden]);

  const clearAllBeds = useCallback(() => {
    const beds = garden.beds?.length > 0 ? garden.beds : [{
      id: 'main',
      name: 'Main Bed',
      width: garden.plot.width,
      height: garden.plot.height,
      plants: garden.plot.plants,
      x: 0,
      y: 0
    }];

    const clearedBeds = beds.map(bed => ({ ...bed, plants: [] }));
    const updatedGarden = {
      ...garden,
      beds: clearedBeds,
      plot: { ...garden.plot, plants: [] }
    };
    
    handleUpdateGarden(updatedGarden);
    setSelectedPlant(null);
    toast.success('All beds cleared!');
  }, [garden, handleUpdateGarden]);

  const exportPlan = useCallback(() => {
    const allPlants = getAllPlants();
    const beds = garden.beds?.length > 0 ? garden.beds : [{
      id: 'main',
      name: 'Main Bed',
      width: garden.plot.width,
      height: garden.plot.height,
      plants: garden.plot.plants,
      x: 0,
      y: 0
    }];

    const planData = {
      gardenName: garden.name,
      beds: beds.map(bed => ({
        name: bed.name,
        size: [bed.width, bed.height],
        plants: bed.plants.map(p => ({
          position: [p.x, p.y],
          plant: p.plant.name,
          type: p.plant.type
        }))
      })),
      totalPlants: allPlants.length,
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
  }, [garden, getAllPlants]);

  const getPlantTypeCounts = () => {
    const allPlants = getAllPlants();
    const counts: Record<string, number> = {};
    allPlants.forEach(p => {
      counts[p.plant.type] = (counts[p.plant.type] || 0) + 1;
    });
    return counts;
  };

  const typeCounts = getPlantTypeCounts();
  const totalPlants = getAllPlants().length;

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Garden Beds - Left Side */}
      <div className="flex-1 overflow-hidden">
        <BedManager
          garden={garden}
          selectedPlant={selectedPlant}
          onUpdateGarden={handleUpdateGarden}
          onClearAllBeds={clearAllBeds}
        />
      </div>
      
      {/* Plant Selector - Right Side */}
      <div className="w-full xl:w-80 h-full">
        <Card className="h-full flex flex-col">
          <CardContent className="pt-6 flex-1 overflow-hidden">
            <PlantSelector
              selectedPlant={selectedPlant}
              onSelectPlant={setSelectedPlant}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};