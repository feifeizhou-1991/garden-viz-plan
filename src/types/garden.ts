export interface Plant {
  id: string;
  name: string;
  type: 'leafy' | 'fruit' | 'root' | 'herb';
  color: string;
  icon: string;
  spacing: number; // grid cells needed
  season: string[];
}

export interface PlantedCell {
  x: number;
  y: number;
  plant: Plant;
}

export interface GardenBed {
  id: string;
  name: string;
  width: number;
  height: number;
  plants: PlantedCell[];
  x: number; // position in garden layout
  y: number; // position in garden layout
  pinned?: boolean; // whether the bed is pinned (not draggable)
}

export interface GardenPlot {
  width: number;
  height: number;
  plants: PlantedCell[];
}

export interface Garden {
  id: string;
  name: string;
  plot: GardenPlot; // Keep for backward compatibility
  beds?: GardenBed[]; // New multiple beds support (optional for backward compatibility)
  createdAt: Date;
}