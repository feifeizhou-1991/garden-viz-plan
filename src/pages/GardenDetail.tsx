import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Garden } from '../types/garden';
import { GardenPlanner } from '../components/GardenPlanner';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit, Sparkles } from 'lucide-react';
import { PlanterAvatars } from '../components/PlanterAvatars';
import { toast } from 'sonner';
import { getGardenById, syncGardenBeds, ensureFixedLayout } from '@/hooks/useGardens';
import { supabase } from '@/integrations/supabase/client';

const GardenDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const isLocalUpdateRef = useRef(false);

  const loadGarden = useCallback(async () => {
    if (!id) return;
    const found = await getGardenById(id);
    if (!found) {
      toast.error('Garden not found');
      navigate('/');
      return;
    }
    // Ensure the fixed bed layout exists for this garden, then reload.
    await ensureFixedLayout(found);
    const refreshed = await getGardenById(id);
    setGarden(refreshed || found);
  }, [id, navigate]);

  useEffect(() => {
    loadGarden();
    if (!id) return;
    const channel = supabase
      .channel(`garden-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'garden_beds', filter: `garden_id=eq.${id}` },
        () => {
          if (isLocalUpdateRef.current) return;
          loadGarden();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gardens', filter: `id=eq.${id}` },
        () => loadGarden()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadGarden]);

  const handleUpdateGarden = useCallback(async (updatedGarden: Garden) => {
    setGarden(updatedGarden);
    isLocalUpdateRef.current = true;
    try {
      await syncGardenBeds(updatedGarden);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save changes');
    } finally {
      // Allow realtime updates again shortly after our own write settles
      setTimeout(() => {
        isLocalUpdateRef.current = false;
      }, 500);
    }
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
    <div className="min-h-screen bg-background p-4">
      <div className="w-full space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="icon" aria-label="Back to gardens">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <span>🌿</span>
                {garden.name}
              </h1>
              <PlanterAvatars garden={garden} />
            </div>
          </div>
          <Button
            onClick={() => setAssistantOpen(true)}
            className="gap-2"
            aria-label="Open garden assistant"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask the Assistant</span>
          </Button>
        </div>

        {/* Garden Planner */}
        <GardenPlanner
          garden={garden}
          onUpdateGarden={handleUpdateGarden}
          assistantOpen={assistantOpen}
          onAssistantOpenChange={setAssistantOpen}
        />
      </div>
    </div>
  );
};

export default GardenDetail;