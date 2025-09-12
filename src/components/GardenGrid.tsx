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
  onMovePlant: (fromX: number, fromY: number, toX: number, toY: number) => void;
}

export const GardenGrid: React.FC<GardenGridProps> = ({
  width,
  height,
  selectedPlant,
  plants,
  onPlantCell,
  onRemoveCell,
  onMovePlant
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [draggedOverCell, setDraggedOverCell] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragStart = (e: React.DragEvent, x: number, y: number) => {
    const plant = getPlantAtCell(x, y);
    if (plant) {
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'existing-plant',
        x,
        y,
        plant: plant.plant
      }));
      e.dataTransfer.effectAllowed = 'move';
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDraggedOverCell({ x, y });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the cell, not moving to a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOverCell(null);
    }
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setDraggedOverCell(null);
    setIsDragging(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'new-plant') {
        // Placing a new plant from the selector
        const existingPlant = getPlantAtCell(x, y);
        if (!existingPlant) {
          onPlantCell(x, y, data.plant);
        }
      } else if (data.type === 'existing-plant') {
        // Moving an existing plant
        const targetPlant = getPlantAtCell(x, y);
        if (!targetPlant && (data.x !== x || data.y !== y)) {
          onMovePlant(data.x, data.y, x, y);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedOverCell(null);
  };

  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const plantedCell = getPlantAtCell(x, y);
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        const isDraggedOver = draggedOverCell?.x === x && draggedOverCell?.y === y;
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={cn(
              "aspect-square border border-grid-line bg-card cursor-pointer transition-all duration-200 flex items-center justify-center text-2xl relative",
              isHovered && !plantedCell && "bg-grid-hover",
              plantedCell && "bg-grid-occupied",
              selectedPlant && !plantedCell && "hover:bg-grid-hover",
              isDraggedOver && !plantedCell && "bg-primary/20 border-primary scale-105",
              isDragging && plantedCell && "opacity-50"
            )}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => setHoveredCell({ x, y })}
            onMouseLeave={() => setHoveredCell(null)}
            onDragStart={(e) => handleDragStart(e, x, y)}
            onDragOver={(e) => handleDragOver(e, x, y)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, x, y)}
            onDragEnd={handleDragEnd}
          >
            {plantedCell && (
              <span 
                className="select-none cursor-move" 
                title={`${plantedCell.plant.name} (drag to move)`}
                draggable
              >
                {plantedCell.plant.icon}
              </span>
            )}
            {isDraggedOver && !plantedCell && (
              <div className="absolute inset-0 bg-primary/10 rounded flex items-center justify-center">
                <span className="text-sm text-primary">Drop here</span>
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