import React, { useState, useCallback, useMemo } from 'react';
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

  // Compute "merged regions" — maximal rectangles of identical plants of size >= 2x2.
  // Cells covered by a merged region still render individually (for clicks/hover/select),
  // but their image is hidden; the region paints one large image overlay on top.
  const { regions, consumed } = useMemo(() => {
    const grid: (PlantedCell | undefined)[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => undefined)
    );
    plants.forEach((p) => {
      if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) grid[p.y][p.x] = p;
    });

    const used = new Set<string>();
    const out: { x: number; y: number; w: number; h: number; cell: PlantedCell }[] = [];

    // In select mode we don't merge — each cell needs to read individually.
    if (selectMode) return { regions: out, consumed: used };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (used.has(`${x},${y}`)) continue;
        const here = grid[y][x];
        if (!here) continue;
        const id = here.plant.id;

        // Expand width as far right as possible with same plant id and not used.
        let w = 1;
        while (
          x + w < width &&
          !used.has(`${x + w},${y}`) &&
          grid[y][x + w]?.plant.id === id
        ) {
          w++;
        }
        // Expand height: every cell of the row must match for the full width.
        let h = 1;
        outer: while (y + h < height) {
          for (let dx = 0; dx < w; dx++) {
            if (used.has(`${x + dx},${y + h}`)) break outer;
            if (grid[y + h][x + dx]?.plant.id !== id) break outer;
          }
          h++;
        }

        if (w >= 2 && h >= 2) {
          out.push({ x, y, w, h, cell: here });
          for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
              used.add(`${x + dx},${y + dy}`);
            }
          }
        }
      }
    }
    return { regions: out, consumed: used };
  }, [plants, width, height, selectMode]);

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
        const isInMergedRegion = consumed.has(`${x},${y}`);

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
            {plantedCell && !isInMergedRegion && (
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
      className="relative inline-grid gap-2 p-8 bg-muted rounded-xl border-2 border-border shadow-lg"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(60px, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(60px, 1fr))`,
      }}
    >
      {renderGrid()}
      {/* Merged-region image overlays. pointer-events-none lets clicks reach the cells beneath. */}
      {regions.map((r) => (
        <div
          key={`region-${r.x}-${r.y}`}
          className="pointer-events-none flex items-center justify-center p-1"
          style={{
            gridColumn: `${r.x + 1} / span ${r.w}`,
            gridRow: `${r.y + 1} / span ${r.h}`,
          }}
          title={r.cell.plant.name}
        >
          <img
            src={r.cell.plant.icon}
            alt={r.cell.plant.name}
            className="w-full h-full object-cover rounded-md drop-shadow-sm"
          />
        </div>
      ))}
    </div>
  );
};