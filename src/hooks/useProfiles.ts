import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Profile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

/**
 * Loads all profiles into a userId -> Profile map.
 * The list is small (one row per signed-up user) so a single fetch is fine.
 */
export function useProfiles() {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // @ts-ignore - profiles not yet in generated types
      const { data } = await supabase.from('profiles').select('user_id, display_name, email, avatar_url');
      if (!active) return;
      const map: Record<string, Profile> = {};
      ((data || []) as unknown as Profile[]).forEach((p) => {
        map[p.user_id] = p;
      });
      setProfiles(map);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { profiles, loading };
}
