import { useState, useEffect } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { Database } from './database.types';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface CurrentMember {
  member: TeamMember | null;
  loading: boolean;
}

export function useCurrentMember(): CurrentMember {
  const { user } = useAuth();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMember(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (!cancelled) {
        setMember(data);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  return { member, loading };
}
