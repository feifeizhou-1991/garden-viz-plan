import React from 'react';
import { PlantedCell } from '@/types/garden';
import { Profile } from '@/hooks/useProfiles';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { PlantInfoView } from './PlantInfoView';

interface PlantInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell?: PlantedCell | null;
  catalogPlant?: {
    slug: string;
    common_name: string;
    image_url?: string | null;
    category?: string;
  } | null;
  bedName?: string;
  planter?: Profile | null;
  onRemove?: () => void;
  onReassign?: (userId: string) => void;
  onPlace?: () => void;
  placeLabel?: string;
}

export const PlantInfoDialog: React.FC<PlantInfoDialogProps> = ({
  open,
  onOpenChange,
  cell,
  catalogPlant,
  bedName,
  planter,
  onRemove,
  onReassign,
  onPlace,
  placeLabel,
}) => {
  const name = cell?.plant.name ?? catalogPlant?.common_name ?? 'Plant';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">Plant details</DialogDescription>
        <PlantInfoView
          cell={cell}
          catalogPlant={catalogPlant}
          bedName={bedName}
          planter={planter}
          onRemove={onRemove}
          onReassign={onReassign}
          onPlace={onPlace}
          placeLabel={placeLabel}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
