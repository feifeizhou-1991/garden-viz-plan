import React from 'react';
import { Plant } from '../types/garden';
import { PLANTS } from '../data/plants';
import { cn } from '../lib/utils';
import { Card } from './ui/card';

interface PlantSelectorProps {
  selectedPlant: Plant | null;
  onSelectPlant: (plant: Plant | null) => void;
}

export const PlantSelector: React.FC<PlantSelectorProps> = ({
  selectedPlant,
  onSelectPlant
}) => {
  const getTypeColor = (type: Plant['type']) => {
    switch (type) {
      case 'leafy': return 'border-l-plant-leafy bg-plant-leafy/10';
      case 'fruit': return 'border-l-plant-fruit bg-plant-fruit/10';
      case 'root': return 'border-l-plant-root bg-plant-root/10';
      case 'herb': return 'border-l-plant-herb bg-plant-herb/10';
      default: return 'border-l-muted bg-muted/10';
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        🌱 Plant Selection
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {PLANTS.map((plant) => (
          <Card
            key={plant.id}
            className={cn(
              "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
              selectedPlant?.id === plant.id 
                ? "ring-2 ring-primary shadow-lg scale-105" 
                : "hover:scale-102",
              getTypeColor(plant.type)
            )}
            onClick={() => onSelectPlant(selectedPlant?.id === plant.id ? null : plant)}
          >
            <div className="text-center space-y-2">
              <div className="text-3xl">{plant.icon}</div>
              <div className="text-sm font-medium text-card-foreground">
                {plant.name}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {plant.type}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {selectedPlant && (
        <div className="mt-4 p-4 bg-secondary rounded-lg border">
          <p className="text-sm text-secondary-foreground">
            <span className="font-medium">Selected:</span> {selectedPlant.icon} {selectedPlant.name}
            <span className="ml-2 text-xs">({selectedPlant.spacing} cell{selectedPlant.spacing > 1 ? 's' : ''} spacing)</span>
          </p>
        </div>
      )}
    </div>
  );
};