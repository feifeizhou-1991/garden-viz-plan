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

// Cell sizing — must stay in sync with the inline-grid template below.
const CELL_PX = 64; // w-16 / h-16
const GAP_PX = 8;   // gap-2
const PADDING_PX = 32; // p-8

interface MergedRegion {
  plantId: string;
  plant: Plant;
  x: number; // left cell column
  y: number; // top cell row
  w: number; // span in cells
  h: number; // span in cells
}

/**
 * Find maximal rectangular regions where the same plant fills every cell,
 * with each region being at least 2 columns × 2 rows. Greedy expansion:
 * for each unvisited planted cell, try to grow a same-plant rectangle as
 * wide and as tall as possible, then mark every cell it covers as visited.
 */
function findMergedRegions(
  width: number,
  height: number,
  plants: PlantedCell[]
): { regions: MergedRegion[]; covered: Set<string> } {
  const grid: (PlantedCell | undefined)[][] = Array.from({ length: height }, () =>
    Array<PlantedCell | undefined>(width).fill(undefined)
  );
  for (const p of plants) {
    if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) {
      grid[p.y][p.x] = p;
    }
  }

  const visited: boolean[][] = Array.from({ length: height }, () =>
    Array<boolean>(width).fill(false)
  );
  const regions: MergedRegion[] = [];
  const covered = new Set<string>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (visited[y][x]) continue;
      const cell = grid[y][x];
      if (!cell) continue;
      const plantId = cell.plant.id;

      // Determine maximum width of same-plant run starting at (x, y)
      let maxW = 0;
      while (
        x + maxW < width &&
        !visited[y][x + maxW] &&
        grid[y][x + maxW]?.plant.id === plantId
      ) {
        maxW++;
      }

      // Try every width from maxW down to 2, then find tallest height
      // that keeps every cell in the rectangle filled with the same plant.
      let bestW = 1;
      let bestH = 1;
      let bestArea = 1;

      for (let w = maxW; w >= 2; w--) {
        let h = 1;
        outer: while (y + h < height) {
          for (let dx = 0; dx < w; dx++) {
            const cx = x + dx;
            const cy = y + h;
            if (visited[cy][cx] || grid[cy][cx]?.plant.id !== plantId) {
              break outer;
            }
          }
          h++;
        }
        if (h >= 2) {
          const area = w * h;
          if (area > bestArea) {
            bestArea = area;
            bestW = w;
            bestH = h;
          }
        }
      }

      if (bestW >= 2 && bestH >= 2) {
        regions.push({ plantId, plant: cell.plant, x, y, w: bestW, h: bestH });
        for (let dy = 0; dy < bestH; dy++) {
          for (let dx = 0; dx < bestW; dx++) {
            visited[y + dy][x + dx] = true;
            covered.add(`${x + dx},${y + dy}`);
          }
        }
      } else {
        visited[y][x] = true;
      }
    }
  }

  return { regions, covered };
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

  // Compute merged regions (≥2×2 same-plant rectangles). Disable while in
  // multi-select mode so the user can still see and click individual slots.
  const { regions: mergedRegions, covered: mergedCovered } = useMemo(() => {
    if (selectMode) return { regions: [] as MergedRegion[], covered: new Set<string>() };
    return findMergedRegions(width, height, plants);
  }, [width, height, plants, selectMode]);

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
        const isMerged = mergedCovered.has(`${x},${y}`);

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
            {plantedCell && !isMerged && (
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
    <div className="relative inline-block">
      <div
        className="inline-grid gap-2 p-8 bg-muted rounded-xl border-2 border-border shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${width}, ${CELL_PX}px)`,
          gridTemplateRows: `repeat(${height}, ${CELL_PX}px)`,
        }}
      >
        {renderGrid()}
      </div>

      {/* Merged-region overlays: one large image spanning multiple cells.
          The cells underneath remain interactive for clicks/hover; this
          overlay is purely visual. */}
      {mergedRegions.map((r) => {
        const left = PADDING_PX + r.x * (CELL_PX + GAP_PX);
        const top = PADDING_PX + r.y * (CELL_PX + GAP_PX);
        const widthPx = r.w * CELL_PX + (r.w - 1) * GAP_PX;
        const heightPx = r.h * CELL_PX + (r.h - 1) * GAP_PX;
        return (
          <div
            key={`merged-${r.x}-${r.y}-${r.plantId}`}
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
            }}
            title={r.plant.name}
          >
            <img
              src={r.plant.icon}
              alt={r.plant.name}
              className="w-[85%] h-[85%] object-contain rounded-md drop-shadow"
            />
          </div>
        );
      })}
    </div>
  );
};