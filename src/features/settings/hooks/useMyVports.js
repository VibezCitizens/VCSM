import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function useMyVports() {
  const { user } = useAuth();
  const [vports, setVports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) { setVports([]); setLoading(false); return; }
    setLoading(true);
    try {
      // OWNED ONLY — no manager joins
      const { data, error } = await supabase
        .from('vports')
        .select('id, name, avatar_url, created_by, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVports(data ?? []);
      setError(null);
    } catch (e) {
      setError(e);
      setVports([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { vports, loading, error, refresh: load };
}
