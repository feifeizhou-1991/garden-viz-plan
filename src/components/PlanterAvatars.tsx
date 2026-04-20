import React, { useMemo } from 'react';
import { Garden } from '@/types/garden';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface PlanterAvatarsProps {
  garden: Garden;
  max?: number;
}

function initials(p: Profile | undefined, fallback: string): string {
  const name = p?.display_name || p?.email || fallback;
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';
}

export const PlanterAvatars: React.FC<PlanterAvatarsProps> = ({ garden, max = 5 }) => {
  const { profiles } = useProfiles();

  // Aggregate unique plant species per planter, sorted by most species first
  const planters = useMemo(() => {
    const speciesByUser = new Map<string, Set<string>>();
    (garden.beds ?? []).forEach((bed) => {
      bed.plants.forEach((p) => {
        if (!p.plantedBy) return;
        const speciesKey = p.slug || p.plant.id || p.plant.name;
        if (!speciesByUser.has(p.plantedBy)) {
          speciesByUser.set(p.plantedBy, new Set());
        }
        speciesByUser.get(p.plantedBy)!.add(speciesKey);
      });
    });
    return Array.from(speciesByUser.entries())
      .map(([userId, set]) => ({ userId, count: set.size, profile: profiles[userId] }))
      .sort((a, b) => b.count - a.count);
  }, [garden.beds, profiles]);

  if (planters.length === 0) return null;

  const visible = planters.slice(0, max);
  const overflow = planters.length - visible.length;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center -space-x-2">
        {visible.map(({ userId, count, profile }) => {
          const label = profile?.display_name || profile?.email || 'Gardener';
          return (
            <Tooltip key={userId}>
              <TooltipTrigger asChild>
                <Avatar className="w-8 h-8 border-2 border-background ring-0 transition-transform hover:scale-110 hover:z-10">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={label} />
                  ) : null}
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                    {initials(profile, label)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">
                    {count} unique species
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                  +{overflow}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {planters.slice(max).map((p) => (
                  <div key={p.userId}>
                    {p.profile?.display_name || p.profile?.email || 'Gardener'} · {p.count}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};