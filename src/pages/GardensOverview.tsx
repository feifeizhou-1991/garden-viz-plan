import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Garden } from '../types/garden';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Calendar, Grid3x3, Trash2, LogOut, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useGardens, createGarden, renameGarden, deleteGarden as deleteGardenApi } from '@/hooks/useGardens';

// Stack of overlapping plant avatars (unique plants in this garden)
const PlantAvatarStack: React.FC<{ garden: Garden }> = ({ garden }) => {
  const beds = garden.beds ?? [];
  const seen = new Set<string>();
  const unique: { name: string; icon: string }[] = [];
  for (const bed of beds) {
    for (const cell of bed.plants) {
      const key = cell.slug || cell.plant.id || cell.plant.name;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({ name: cell.plant.name, icon: cell.plant.icon });
    }
  }
  if (unique.length === 0) return null;
  const visible = unique.slice(0, 6);
  const extra = unique.length - visible.length;
  return (
    <div className="flex items-center pt-2">
      {visible.map((p, i) => (
        <div
          key={`${p.name}-${i}`}
          className="w-7 h-7 rounded-full bg-card border-2 border-background ring-1 ring-border overflow-hidden flex items-center justify-center -ml-2 first:ml-0 shadow-sm"
          title={p.name}
        >
          {p.icon ? (
            <img
              src={p.icon}
              alt={p.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {p.name.slice(0, 1)}
            </span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-muted border-2 border-background ring-1 ring-border flex items-center justify-center -ml-2 text-[10px] font-medium text-muted-foreground shadow-sm">
          +{extra}
        </div>
      )}
    </div>
  );
};

const GardensOverview: React.FC = () => {
  const navigate = useNavigate();
  const { gardens, loading } = useGardens();
  const [newGardenName, setNewGardenName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateGarden = async () => {
    if (!newGardenName.trim()) {
      toast.error('Please enter a garden name');
      return;
    }
    try {
      await createGarden(newGardenName.trim());
      toast.success(`Created garden "${newGardenName.trim()}"`);
      setNewGardenName('');
      setShowCreateDialog(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create garden');
    }
  };

  const handleRenameGarden = async () => {
    if (!editingGarden || !editName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }
    try {
      await renameGarden(editingGarden.id, editName.trim());
      toast.success(`Renamed garden to "${editName.trim()}"`);
      setEditingGarden(null);
      setEditName('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to rename garden');
    }
  };

  const handleDeleteGarden = async (garden: Garden) => {
    if (gardens.length <= 1) {
      toast.error('Cannot delete the last garden');
      return;
    }
    try {
      await deleteGardenApi(garden.id);
      toast.success(`Deleted garden "${garden.name}"`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete garden');
    }
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Welcome to our shared garden space! This is a place for growing food, building community,
            and enjoying nature together. To keep things running smoothly and ensure everyone feels
            welcome, please follow our community guidelines.
          </p>
          <div className="flex justify-center pt-2">
            <Link to="/community-rules">
              <Button variant="default" size="sm">
                <BookOpen className="w-4 h-4" />
                Community Guidelines
              </Button>
            </Link>
          </div>
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
                            <PlantAvatarStack garden={garden} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent />
                    </Link>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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