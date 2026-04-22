import React, { useState, useCallback } from 'react';
import { Plant, PlantedCell } from '../types/garden';
import { cn } from '../lib/utils';
import { Plus, Check } from 'lucide-react';

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
  selectMode?: boolean;
  selectedCells?: Set<string>;
  onToggleSelection?: (x: number, y: number) => void;
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
  selectMode = false,
  selectedCells,
  onToggleSelection,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const getPlantAtCell = useCallback((x: number, y: number) => {
    return plants.find(p => p.x === x && p.y === y);
  }, [plants]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const existingPlant = getPlantAtCell(x, y);

    if (selectMode) {
      // In multi-select mode, only empty cells can be selected.
      if (!existingPlant && onToggleSelection) {
        onToggleSelection(x, y);
      }
      return;
    }

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
  }, [selectMode, selectedPlant, getPlantAtCell, onPlantCell, onRemoveCell, onEmptyCellClick, onPlantedCellClick, onToggleSelection]);

  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const plantedCell = getPlantAtCell(x, y);
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        const isSelected = selectMode && selectedCells?.has(`${x},${y}`);
        const isSelectableEmpty = selectMode && !plantedCell;

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cn(
              "w-16 h-16 border border-grid-line bg-card cursor-pointer transition-all duration-200 flex items-center justify-center text-3xl relative rounded-lg",
              isHovered && !plantedCell && !isSelected && "bg-grid-hover",
              plantedCell && "bg-grid-occupied",
              selectedPlant && !plantedCell && !selectMode && "hover:bg-grid-hover",
              isSelected && "bg-primary/20 border-primary ring-2 ring-primary/40",
              selectMode && plantedCell && "opacity-60 cursor-not-allowed",
              isSelectableEmpty && !isSelected && "hover:bg-primary/10"
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
            {!plantedCell && isHovered && !selectMode && (
              <Plus
                className="w-6 h-6 text-muted-foreground/60 pointer-events-none transition-opacity"
                strokeWidth={2.5}
              />
            )}
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
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