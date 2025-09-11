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

export interface GardenPlot {
  width: number;
  height: number;
  plants: PlantedCell[];
}

export interface Garden {
  id: string;
  name: string;
  plot: GardenPlot;
  createdAt: Date;
}