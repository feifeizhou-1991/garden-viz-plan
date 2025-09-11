import React, { useState } from 'react';
import { Garden } from '../types/garden';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface GardenTabsProps {
  gardens: Garden[];
  activeGardenId: string;
  onSelectGarden: (gardenId: string) => void;
  onCreateGarden: (name: string) => void;
  onRenameGarden: (gardenId: string, newName: string) => void;
  onDeleteGarden: (gardenId: string) => void;
}

export const GardenTabs: React.FC<GardenTabsProps> = ({
  gardens,
  activeGardenId,
  onSelectGarden,
  onCreateGarden,
  onRenameGarden,
  onDeleteGarden
}) => {
  const [newGardenName, setNewGardenName] = useState('');
  const [renamingGarden, setRenamingGarden] = useState<Garden | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateGarden = () => {
    if (!newGardenName.trim()) {
      toast.error('Please enter a garden name');
      return;
    }
    
    onCreateGarden(newGardenName.trim());
    setNewGardenName('');
    setShowCreateDialog(false);
    toast.success(`Created garden "${newGardenName.trim()}"`);
  };

  const handleRenameGarden = () => {
    if (!renamingGarden || !renameValue.trim()) {
      toast.error('Please enter a valid name');
      return;
    }
    
    onRenameGarden(renamingGarden.id, renameValue.trim());
    toast.success(`Renamed garden to "${renameValue.trim()}"`);
    setRenamingGarden(null);
    setRenameValue('');
  };

  const handleDeleteGarden = (garden: Garden) => {
    if (gardens.length <= 1) {
      toast.error('Cannot delete the last garden');
      return;
    }
    
    onDeleteGarden(garden.id);
    toast.success(`Deleted garden "${garden.name}"`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1">
        <Tabs value={activeGardenId} onValueChange={onSelectGarden}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${gardens.length}, minmax(0, 1fr))` }}>
            {gardens.map((garden) => (
              <div key={garden.id} className="relative group">
                <TabsTrigger 
                  value={garden.id}
                  className="w-full px-3 py-2 text-sm relative"
                >
                  {garden.name}
                </TabsTrigger>
                
                {/* Garden actions */}
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingGarden(garden);
                          setRenameValue(garden.name);
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
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          placeholder="Enter new garden name"
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameGarden()}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setRenamingGarden(null)}>
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
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGarden(garden);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Create new garden */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Garden
          </Button>
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
    </div>
  );
};