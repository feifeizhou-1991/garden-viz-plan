import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Garden } from '../types/garden';
import { GardenPlanner } from '../components/GardenPlanner';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';

// Get gardens from localStorage
const getStoredGardens = (): Garden[] => {
  const stored = localStorage.getItem('gardens');
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt)
    }));
  }
  return [];
};

const GardenDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [garden, setGarden] = useState<Garden | null>(null);

  useEffect(() => {
    const gardens = getStoredGardens();
    console.log('Available gardens:', gardens);
    console.log('Looking for garden with id:', id);
    
    const foundGarden = gardens.find(g => g.id === id);
    
    if (!foundGarden) {
      console.error('Garden not found with id:', id);
      toast.error('Garden not found');
      navigate('/');
      return;
    }
    
    console.log('Found garden:', foundGarden);
    setGarden(foundGarden);
  }, [id, navigate]);

  const handleUpdateGarden = useCallback((updatedGarden: Garden) => {
    const gardens = getStoredGardens();
    const updatedGardens = gardens.map(g =>
      g.id === updatedGarden.id ? updatedGarden : g
    );
    
    localStorage.setItem('gardens', JSON.stringify(updatedGardens));
    setGarden(updatedGarden);
  }, []);

  if (!garden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading garden...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Gardens
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <span>🌿</span>
                {garden.name}
              </h1>
              <p className="text-muted-foreground">
                Created on {garden.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Garden Planner */}
        <GardenPlanner
          garden={garden}
          onUpdateGarden={handleUpdateGarden}
        />
      </div>
    </div>
  );
};

export default GardenDetail;