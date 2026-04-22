import React, { useState, useCallback } from 'react';
import { Plant, PlantedCell } from '../types/garden';
import { cn } from '../lib/utils';
import { Plus } from 'lucide-react';

interface GardenGridProps {
  width: number;
  height: number;
  selectedPlant: Plant | null;
  plants: PlantedCell[];
  onPlantCell: (x: number, y: number, plant: Plant) => void;
  onRemoveCell: (x: number, y: number) => void;
  onMovePlant?: (fromX: number, fromY: number, toX: number, toY: number) => void;
  onEmptyCellClick?: (x: number, y: number) => void;
  onPlantedCellClick?: (x: number, y: number) => void;
}

export const GardenGrid: React.FC<GardenGridProps> = ({
  width,
  height,
  selectedPlant,
  plants,
  onPlantCell,
  onRemoveCell,
  onEmptyCellClick,
  onPlantedCellClick,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const getPlantAtCell = useCallback((x: number, y: number) => {
    return plants.find(p => p.x === x && p.y === y);
  }, [plants]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const existingPlant = getPlantAtCell(x, y);
    
    if (existingPlant) {
      if (onPlantedCellClick) {
        onPlantedCellClick(x, y);
      } else {
        onRemoveCell(x, y);
      }
    } else if (selectedPlant) {
      onPlantCell(x, y, selectedPlant);
    } else if (onEmptyCellClick) {
      onEmptyCellClick(x, y);
    }
  }, [selectedPlant, getPlantAtCell, onPlantCell, onRemoveCell, onEmptyCellClick, onPlantedCellClick]);

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
              "w-16 h-16 border border-grid-line bg-card cursor-pointer transition-all duration-200 flex items-center justify-center text-3xl relative rounded-lg",
              isHovered && !plantedCell && "bg-grid-hover",
              plantedCell && "bg-grid-occupied",
              selectedPlant && !plantedCell && "hover:bg-grid-hover"
            )}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => setHoveredCell({ x, y })}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {plantedCell && (
              <div
                className="select-none w-full h-full flex items-center justify-center"
                title={plantedCell.plant.name}
              >
                <img 
                  src={plantedCell.plant.icon} 
                  alt={plantedCell.plant.name} 
                  className="w-12 h-12 object-cover rounded-sm pointer-events-none"
                />
              </div>
            )}
            {!plantedCell && isHovered && (
              <Plus
                className="w-6 h-6 text-muted-foreground/60 pointer-events-none transition-opacity"
                strokeWidth={2.5}
              />
            )}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div 
      className="inline-grid gap-2 p-8 bg-muted rounded-xl border-2 border-border shadow-lg"
      style={{ 
        gridTemplateColumns: `repeat(${width}, minmax(60px, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(60px, 1fr))`
      }}
    >
      {renderGrid()}
    </div>
  );
};