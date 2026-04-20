import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Garden } from '../types/garden';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Calendar, Grid3x3, Pencil, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Get gardens from localStorage or return default
const getStoredGardens = (): Garden[] => {
  const stored = localStorage.getItem('gardens');
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt)
    }));
  }
  return [
    {
      id: 'default',
      name: 'Garden 2026',
      plot: {
        width: 12,
        height: 8,
        plants: []
      },
      createdAt: new Date()
    }
  ];
};

const GardensOverview: React.FC = () => {
  const navigate = useNavigate();
  const [gardens, setGardens] = useState<Garden[]>(() => {
    const stored = getStoredGardens().map((g) =>
      g.name === 'My First Garden' ? { ...g, name: 'Garden 2026' } : g
    );
    // Ensure gardens are always saved to localStorage
    localStorage.setItem('gardens', JSON.stringify(stored));
    return stored;
  });
  const [newGardenName, setNewGardenName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null);
  const [editName, setEditName] = useState('');

  // Save to localStorage whenever gardens change
  const saveGardens = useCallback((updatedGardens: Garden[]) => {
    localStorage.setItem('gardens', JSON.stringify(updatedGardens));
    setGardens(updatedGardens);
  }, []);

  const handleCreateGarden = () => {
    if (!newGardenName.trim()) {
      toast.error('Please enter a garden name');
      return;
    }
    
    const newGarden: Garden = {
      id: `garden-${Date.now()}`,
      name: newGardenName.trim(),
      plot: {
        width: 12,
        height: 8,
        plants: []
      },
      createdAt: new Date()
    };
    
    const updatedGardens = [...gardens, newGarden];
    saveGardens(updatedGardens);
    setNewGardenName('');
    setShowCreateDialog(false);
    toast.success(`Created garden "${newGardenName.trim()}"`);
  };

  const handleRenameGarden = () => {
    if (!editingGarden || !editName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }
    
    const updatedGardens = gardens.map(garden => 
      garden.id === editingGarden.id 
        ? { ...garden, name: editName.trim() }
        : garden
    );
    saveGardens(updatedGardens);
    toast.success(`Renamed garden to "${editName.trim()}"`);
    setEditingGarden(null);
    setEditName('');
  };

  const handleDeleteGarden = (garden: Garden) => {
    if (gardens.length <= 1) {
      toast.error('Cannot delete the last garden');
      return;
    }
    
    const updatedGardens = gardens.filter(g => g.id !== garden.id);
    saveGardens(updatedGardens);
    toast.success(`Deleted garden "${garden.name}"`);
  };

  const startEditing = (garden: Garden) => {
    setEditingGarden(garden);
    setEditName(garden.name);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">🌿 Groene Kaap Community Garden</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage and plan your vegetable garden layouts
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-2xl mx-auto relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

          <ul className="space-y-8">
            {gardens
              .slice()
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .map((garden) => (
                <li key={garden.id} className="relative pl-16 group">
                  {/* Dot */}
                  <span className="absolute left-4 top-6 w-5 h-5 rounded-full bg-primary border-4 border-background ring-2 ring-primary" />

                  <Card className="hover:shadow-lg transition-shadow relative">
                    <Link to={`/garden/${garden.id}`} className="block">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{garden.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {garden.createdAt.toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent />
                    </Link>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              startEditing(garden);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rename Garden</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Enter new garden name"
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameGarden()}
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingGarden(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleRenameGarden}>
                                Rename
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {gardens.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteGarden(garden);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              ))}

            {/* Empty slot to create a new garden */}
            <li className="relative pl-16">
              <span className="absolute left-4 top-6 w-5 h-5 rounded-full bg-background border-2 border-dashed border-muted-foreground" />

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full rounded-lg border-2 border-dashed border-muted-foreground/40 bg-card/30 hover:bg-card hover:border-primary transition-colors p-6 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create new garden</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Garden</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      value={newGardenName}
                      onChange={(e) => setNewGardenName(e.target.value)}
                      placeholder="Enter garden name"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateGarden()}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateGarden}>
                        Create Garden
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GardensOverview;