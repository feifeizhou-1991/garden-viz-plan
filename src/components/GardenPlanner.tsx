import React, { useState, useCallback } from 'react';
import { Plant, PlantedCell, Garden } from '../types/garden';
import { BedManager } from './BedManager';
import { AssistantDrawer } from './AssistantDrawer';
import { PlantInfoDialog } from './PlantInfoDialog';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GardenPlannerProps {
  garden: Garden;
  onUpdateGarden: (garden: Garden) => void;
  assistantOpen?: boolean;
  onAssistantOpenChange?: (open: boolean) => void;
}

export const GardenPlanner: React.FC<GardenPlannerProps> = ({
  garden,
  onUpdateGarden,
  assistantOpen,
  onAssistantOpenChange,
}) => {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [pendingCell, setPendingCell] = useState<{ bedId: string; x: number; y: number } | null>(null);
  const [infoCell, setInfoCell] = useState<{ bedId: string; x: number; y: number } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCellsByBed, setSelectedCellsByBed] = useState<Record<string, Set<string>>>({});
  const [pendingCells, setPendingCells] = useState<{ bedId: string; x: number; y: number }[] | null>(null);
  const drawerOpen = pendingCell !== null || pendingCells !== null || !!assistantOpen;
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

  const handleToggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) {
        // Leaving select mode — clear selection.
        setSelectedCellsByBed({});
      }
      return !prev;
    });
  }, []);

  const handleToggleCellSelection = useCallback((bedId: string, x: number, y: number) => {
    setSelectedCellsByBed((prev) => {
      const next = { ...prev };
      const set = new Set(next[bedId] ?? []);
      const key = `${x},${y}`;
      if (set.has(key)) set.delete(key);
      else set.add(key);
      if (set.size === 0) delete next[bedId];
      else next[bedId] = set;
      return next;
    });
  }, []);

  const handleAddPlantsToSelection = useCallback(() => {
    const cells: { bedId: string; x: number; y: number }[] = [];
    Object.entries(selectedCellsByBed).forEach(([bedId, set]) => {
      set.forEach((key) => {
        const [x, y] = key.split(',').map(Number);
        cells.push({ bedId, x, y });
      });
    });
    if (cells.length === 0) return;
    setPendingCells(cells);
  }, [selectedCellsByBed]);

  const handlePlaceForCells = useCallback(
    async (cells: { bedId: string; x: number; y: number }[], plant: Plant) => {
      const beds = garden.beds || [];
      const { data: userData } = await supabase.auth.getUser();
      const planter = userData.user?.id;
      const now = new Date().toISOString();
      // Group target cells by bed
      const byBed = new Map<string, { x: number; y: number }[]>();
      cells.forEach((c) => {
        const arr = byBed.get(c.bedId) ?? [];
        arr.push({ x: c.x, y: c.y });
        byBed.set(c.bedId, arr);
      });
      let added = 0;
      const updatedBeds = beds.map((b) => {
        const targets = byBed.get(b.id);
        if (!targets) return b;
        const occupied = new Set(b.plants.map((p) => `${p.x},${p.y}`));
        const additions: PlantedCell[] = [];
        for (const t of targets) {
          const key = `${t.x},${t.y}`;
          if (occupied.has(key)) continue;
          occupied.add(key);
          additions.push({
            x: t.x,
            y: t.y,
            plant,
            plantedBy: planter,
            plantedAt: now,
          });
        }
        added += additions.length;
        return { ...b, plants: [...b.plants, ...additions] };
      });
      if (added === 0) {
        toast.error('All selected cells are already taken.');
        return;
      }
      handleUpdateGarden({ ...garden, beds: updatedBeds });
      toast.success(`Planted ${added} ${plant.name}${added > 1 ? 's' : ''}`);
      setSelectedCellsByBed({});
      setSelectMode(false);
      setPendingCells(null);
    },
    [garden, handleUpdateGarden]
  );

  const handlePlacePlant = useCallback(
    async (bedId: string, x: number, y: number, plant: Plant) => {
      const beds = garden.beds || [];
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return;
      const { data: userData } = await supabase.auth.getUser();
      const planter = userData.user?.id;
      const newPlants = bed.plants.filter((p) => !(p.x === x && p.y === y));
      newPlants.push({
        x,
        y,
        plant,
        plantedBy: planter,
        plantedAt: new Date().toISOString(),
      });
      const updatedBeds = beds.map((b) =>
        b.id === bed.id ? { ...b, plants: newPlants } : b
      );
      handleUpdateGarden({ ...garden, beds: updatedBeds });
      toast.success(`Planted ${plant.name}`);
    },
    [garden, handleUpdateGarden]
  );

  const handleApplyProposal = useCallback(
    async (
      bedId: string,
      items: { plant: Plant; x: number; y: number }[]
    ) => {
      const beds = garden.beds || [];
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return;
      const { data: userData } = await supabase.auth.getUser();
      const planter = userData.user?.id;
      const now = new Date().toISOString();
      const occupied = new Set(bed.plants.map((p) => `${p.x},${p.y}`));
      const additions: PlantedCell[] = [];
      for (const it of items) {
        const key = `${it.x},${it.y}`;
        if (occupied.has(key)) continue;
        occupied.add(key);
        additions.push({
          x: it.x,
          y: it.y,
          plant: it.plant,
          plantedBy: planter,
          plantedAt: now,
        });
      }
      if (!additions.length) {
        toast.error('All proposed cells are already taken.');
        return;
      }
      const updatedBeds = beds.map((b) =>
        b.id === bed.id ? { ...b, plants: [...b.plants, ...additions] } : b
      );
      handleUpdateGarden({ ...garden, beds: updatedBeds });
      toast.success(`Planted ${additions.length} plant${additions.length > 1 ? 's' : ''}`);
    },
    [garden, handleUpdateGarden]
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

  const reassignInfoPlanter = useCallback(
    (userId: string) => {
      if (!infoCell) return;
      const beds = garden.beds || [];
      const bed = beds.find((b) => b.id === infoCell.bedId);
      if (!bed) return;
      const newPlants = bed.plants.map((p) =>
        p.x === infoCell.x && p.y === infoCell.y ? { ...p, plantedBy: userId } : p
      );
      const updatedBeds = beds.map((b) =>
        b.id === bed.id ? { ...b, plants: newPlants } : b
      );
      handleUpdateGarden({ ...garden, beds: updatedBeds });
      const name =
        profiles[userId]?.display_name || profiles[userId]?.email || 'gardener';
      toast.success(`Assigned to ${name}`);
    },
    [infoCell, garden, handleUpdateGarden, profiles]
  );

  return (
    <div className="h-[calc(100vh-12rem)]">
      <BedManager
        garden={garden}
        selectedPlant={selectedPlant}
        onUpdateGarden={handleUpdateGarden}
        onClearAllBeds={clearAllBeds}
        onEmptyCellClick={handleEmptyCellClick}
        onPlantedCellClick={handlePlantedCellClick}
        selectMode={selectMode}
        onToggleSelectMode={handleToggleSelectMode}
        selectedCellsByBed={selectedCellsByBed}
        onToggleCellSelection={handleToggleCellSelection}
        onAddPlantsToSelection={handleAddPlantsToSelection}
      />

      <AssistantDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCell(null);
            setPendingCells(null);
            onAssistantOpenChange?.(false);
          }
        }}
        garden={garden}
        targetCell={pendingCell}
        targetCells={pendingCells}
        onPlacePlant={handlePlacePlant}
        onApplyProposal={handleApplyProposal}
        onPlacePlantInCells={handlePlaceForCells}
      />

      <PlantInfoDialog
        open={infoCell !== null}
        onOpenChange={(open) => {
          if (!open) setInfoCell(null);
        }}
        cell={infoPlantedCell}
        bedName={infoBed?.name}
        planter={infoPlanter}
        onRemove={removeInfoPlant}
        onReassign={reassignInfoPlanter}
      />
    </div>
  );
};