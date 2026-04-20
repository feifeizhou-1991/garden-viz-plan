import React from 'react';
import { PlantedCell } from '@/types/garden';
import { Profile } from '@/hooks/useProfiles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Trash2, User, Calendar, Sprout } from 'lucide-react';

interface PlantInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: PlantedCell | null;
  bedName?: string;
  planter?: Profile | null;
  onRemove: () => void;
}

export const PlantInfoDialog: React.FC<PlantInfoDialogProps> = ({
  open,
  onOpenChange,
  cell,
  bedName,
  planter,
  onRemove,
}) => {
  if (!cell) return null;
  const { plant, plantedAt, plantedBy } = cell;

  const planterLabel =
    planter?.display_name ||
    planter?.email ||
    (plantedBy ? 'Unknown gardener' : 'Not recorded');

  const formattedDate = plantedAt
    ? new Date(plantedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not recorded';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={plant.icon}
              alt={plant.name}
              className="w-12 h-12 object-cover rounded-md border"
            />
            <span>{plant.name}</span>
          </DialogTitle>
          <DialogDescription className="capitalize">{plant.type}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {bedName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sprout className="w-4 h-4" />
              <span>
                {bedName} · cell ({cell.x + 1}, {cell.y + 1})
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">Planted by</span>
            <span className="font-medium">{planterLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">On</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          {plant.season?.length ? (
            <div className="text-muted-foreground">
              Season: <span className="text-foreground">{plant.season.join(', ')}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="w-4 h-4 mr-2" />
            Remove plant
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
