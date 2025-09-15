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

  const handleDragStart = (e: React.DragEvent, plant: Plant) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'new-plant',
      plant
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        🌱 Plant Selection
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click to select or drag to plant
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {PLANTS.map((plant) => (
          <Card
            key={plant.id}
            draggable
            className={cn(
              "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
              selectedPlant?.id === plant.id 
                ? "ring-2 ring-primary shadow-lg scale-105" 
                : "hover:scale-102",
              getTypeColor(plant.type)
            )}
            onClick={() => onSelectPlant(selectedPlant?.id === plant.id ? null : plant)}
            onDragStart={(e) => handleDragStart(e, plant)}
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto overflow-hidden rounded-lg bg-white/10 flex items-center justify-center">
                <img 
                  src={plant.icon} 
                  alt={plant.name} 
                  className="w-10 h-10 object-cover rounded-md"
                />
              </div>
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
          <p className="text-sm text-secondary-foreground flex items-center gap-2">
            <span className="font-medium">Selected:</span>
            <img 
              src={selectedPlant.icon} 
              alt={selectedPlant.name} 
              className="w-6 h-6 object-cover rounded"
            />
            {selectedPlant.name}
            <span className="ml-2 text-xs">({selectedPlant.spacing} cell{selectedPlant.spacing > 1 ? 's' : ''} spacing)</span>
          </p>
        </div>
      )}
    </div>
  );
};