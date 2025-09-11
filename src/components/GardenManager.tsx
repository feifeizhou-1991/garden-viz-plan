import React, { useState, useCallback } from 'react';
import { Garden } from '../types/garden';
import { GardenTabs } from './GardenTabs';
import { GardenPlanner } from './GardenPlanner';

export const GardenManager: React.FC = () => {
  const [gardens, setGardens] = useState<Garden[]>([
    {
      id: 'default',
      name: 'My First Garden',
      plot: {
        width: 12,
        height: 8,
        plants: []
      },
      createdAt: new Date()
    }
  ]);
  
  const [activeGardenId, setActiveGardenId] = useState('default');

  const activeGarden = gardens.find(g => g.id === activeGardenId) || gardens[0];

  const handleCreateGarden = useCallback((name: string) => {
    const newGarden: Garden = {
      id: `garden-${Date.now()}`,
      name,
      plot: {
        width: 12,
        height: 8,
        plants: []
      },
      createdAt: new Date()
    };
    
    setGardens(prev => [...prev, newGarden]);
    setActiveGardenId(newGarden.id);
  }, []);

  const handleRenameGarden = useCallback((gardenId: string, newName: string) => {
    setGardens(prev => prev.map(garden => 
      garden.id === gardenId 
        ? { ...garden, name: newName }
        : garden
    ));
  }, []);

  const handleDeleteGarden = useCallback((gardenId: string) => {
    setGardens(prev => {
      const filtered = prev.filter(g => g.id !== gardenId);
      // If we're deleting the active garden, switch to the first remaining one
      if (gardenId === activeGardenId && filtered.length > 0) {
        setActiveGardenId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeGardenId]);

  const handleUpdateGarden = useCallback((updatedGarden: Garden) => {
    setGardens(prev => prev.map(garden =>
      garden.id === updatedGarden.id ? updatedGarden : garden
    ));
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">🌿 Garden Planner</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Design multiple vegetable garden layouts with visual planning tools
          </p>
        </div>

        {/* Garden Navigation */}
        <GardenTabs
          gardens={gardens}
          activeGardenId={activeGardenId}
          onSelectGarden={setActiveGardenId}
          onCreateGarden={handleCreateGarden}
          onRenameGarden={handleRenameGarden}
          onDeleteGarden={handleDeleteGarden}
        />

        {/* Active Garden Planner */}
        {activeGarden && (
          <GardenPlanner
            key={activeGarden.id} // Force re-render when switching gardens
            garden={activeGarden}
            onUpdateGarden={handleUpdateGarden}
          />
        )}
      </div>
    </div>
  );
};