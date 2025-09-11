import React, { useState, useCallback } from 'react';
import { Plant, PlantedCell } from '../types/garden';
import { cn } from '../lib/utils';

interface GardenGridProps {
  width: number;
  height: number;
  selectedPlant: Plant | null;
  plants: PlantedCell[];
  onPlantCell: (x: number, y: number, plant: Plant) => void;
  onRemoveCell: (x: number, y: number) => void;
}

export const GardenGrid: React.FC<GardenGridProps> = ({
  width,
  height,
  selectedPlant,
  plants,
  onPlantCell,
  onRemoveCell
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const getPlantAtCell = useCallback((x: number, y: number) => {
    return plants.find(p => p.x === x && p.y === y);
  }, [plants]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const existingPlant = getPlantAtCell(x, y);
    
    if (existingPlant) {
      onRemoveCell(x, y);
    } else if (selectedPlant) {
      onPlantCell(x, y, selectedPlant);
    }
  }, [selectedPlant, getPlantAtCell, onPlantCell, onRemoveCell]);

  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const plantedCell = getPlantAtCell(x, y);
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={cn(
              "aspect-square border border-grid-line bg-card cursor-pointer transition-all duration-200 flex items-center justify-center text-2xl",
              isHovered && !plantedCell && "bg-grid-hover",
              plantedCell && "bg-grid-occupied",
              selectedPlant && !plantedCell && "hover:bg-grid-hover"
            )}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => setHoveredCell({ x, y })}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {plantedCell && (
              <span className="select-none" title={plantedCell.plant.name}>
                {plantedCell.plant.icon}
              </span>
            )}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div 
      className="inline-grid gap-1 p-6 bg-muted rounded-xl border-2 border-border shadow-lg"
      style={{ 
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`
      }}
    >
      {renderGrid()}
    </div>
  );
};