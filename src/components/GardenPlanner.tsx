import React, { useState, useCallback } from 'react';
import { Plant, PlantedCell, Garden } from '../types/garden';
import { BedManager } from './BedManager';
import { PlantSelector } from './PlantSelector';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { PlantInfoDialog } from './PlantInfoDialog';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GardenPlannerProps {
  garden: Garden;
  onUpdateGarden: (garden: Garden) => void;
}

export const GardenPlanner: React.FC<GardenPlannerProps> = ({ garden, onUpdateGarden }) => {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [pendingCell, setPendingCell] = useState<{ bedId: string; x: number; y: number } | null>(null);
  const [infoCell, setInfoCell] = useState<{ bedId: string; x: number; y: number } | null>(null);
  const drawerOpen = pendingCell !== null;
  const { profiles } = useProfiles();

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

  const handleEmptyCellClick = useCallback(
    (bedId: string, x: number, y: number) => {
      setPendingCell({ bedId, x, y });
    },
    []
  );

  const handlePickPlant = useCallback(
    async (plant: Plant | null) => {
      if (!plant || !pendingCell) {
        setPendingCell(null);
        return;
      }
      const beds = garden.beds || [];
      const bed = beds.find((b) => b.id === pendingCell.bedId);
      if (!bed) {
        setPendingCell(null);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const planter = userData.user?.id;
      const newPlants = bed.plants.filter(
        (p) => !(p.x === pendingCell.x && p.y === pendingCell.y)
      );
      newPlants.push({
        x: pendingCell.x,
        y: pendingCell.y,
        plant,
        plantedBy: planter,
        plantedAt: new Date().toISOString(),
      });
      const updatedBeds = beds.map((b) =>
        b.id === bed.id ? { ...b, plants: newPlants } : b
      );
      handleUpdateGarden({ ...garden, beds: updatedBeds });
      toast.success(`Planted ${plant.name}`);
      setPendingCell(null);
    },
    [pendingCell, garden, handleUpdateGarden]
  );

  const handlePlantedCellClick = useCallback(
    (bedId: string, x: number, y: number) => {
      setInfoCell({ bedId, x, y });
    },
    []
  );

  const infoBed = infoCell ? garden.beds?.find((b) => b.id === infoCell.bedId) : null;
  const infoPlantedCell = infoBed?.plants.find(
    (p) => p.x === infoCell?.x && p.y === infoCell?.y
  ) || null;
  const infoPlanter = infoPlantedCell?.plantedBy ? profiles[infoPlantedCell.plantedBy] : null;

  const removeInfoPlant = useCallback(() => {
    if (!infoCell) return;
    const beds = garden.beds || [];
    const bed = beds.find((b) => b.id === infoCell.bedId);
    if (!bed) {
      setInfoCell(null);
      return;
    }
    const removed = bed.plants.find((p) => p.x === infoCell.x && p.y === infoCell.y);
    const newPlants = bed.plants.filter(
      (p) => !(p.x === infoCell.x && p.y === infoCell.y)
    );
    const updatedBeds = beds.map((b) =>
      b.id === bed.id ? { ...b, plants: newPlants } : b
    );
    handleUpdateGarden({ ...garden, beds: updatedBeds });
    if (removed) toast.success(`Removed ${removed.plant.name}`);
    setInfoCell(null);
  }, [infoCell, garden, handleUpdateGarden]);

  return (
    <div className="h-[calc(100vh-12rem)]">
      <BedManager
        garden={garden}
        selectedPlant={selectedPlant}
        onUpdateGarden={handleUpdateGarden}
        onClearAllBeds={clearAllBeds}
        onEmptyCellClick={handleEmptyCellClick}
        onPlantedCellClick={handlePlantedCellClick}
      />

      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) setPendingCell(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Choose a plant</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden mt-4">
            <PlantSelector
              selectedPlant={null}
              onSelectPlant={handlePickPlant}
            />
          </div>
        </SheetContent>
      </Sheet>

      <PlantInfoDialog
        open={infoCell !== null}
        onOpenChange={(open) => {
          if (!open) setInfoCell(null);
        }}
        cell={infoPlantedCell}
        bedName={infoBed?.name}
        planter={infoPlanter}
        onRemove={removeInfoPlant}
      />
    </div>
  );
};