import React, { useState, useMemo } from 'react';
import { Plant } from '../types/garden';
import { PLANTS } from '../data/plants';
import { cn } from '../lib/utils';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface PlantSelectorProps {
  selectedPlant: Plant | null;
  onSelectPlant: (plant: Plant | null) => void;
}

type FilterType = 'all' | Plant['type'];

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fruit', label: 'Fruits' },
  { id: 'leafy', label: 'Leafy' },
  { id: 'root', label: 'Root' },
  { id: 'herb', label: 'Herbs' },
  { id: 'flower', label: 'Flowers' },
  { id: 'other', label: 'Other' },
];

export const PlantSelector: React.FC<PlantSelectorProps> = ({
  selectedPlant,
  onSelectPlant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredPlants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return PLANTS.filter((plant) => {
      if (filter !== 'all' && plant.type !== filter) return false;
      if (!term) return true;
      return (
        plant.name.toLowerCase().includes(term) ||
        plant.type.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, filter]);
  const getTypeColor = (type: Plant['type']) => {
    switch (type) {
      case 'leafy': return 'border-l-plant-leafy bg-plant-leafy/10';
      case 'fruit': return 'border-l-plant-fruit bg-plant-fruit/10';
      case 'root': return 'border-l-plant-root bg-plant-root/10';
      case 'herb': return 'border-l-plant-herb bg-plant-herb/10';
      case 'flower': return 'border-l-pink-400 bg-pink-400/10';
      case 'other': return 'border-l-emerald-500 bg-emerald-500/10';
      default: return 'border-l-muted bg-muted/10';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        🌱 Plant Selection
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click a plant to place it
      </p>
      
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search plants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              filter === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Scrollable Plant Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3">
        {filteredPlants.map((plant) => (
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