// src/features/settings/hooks/useMyVports.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function useMyVports() {
  const { user } = useAuth();
  const [vports, setVports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!user?.id) { setVports([]); setLoading(false); return; }
    setLoading(true);
    try {
      // OWNED
      const { data: owned, error: ownedErr } = await supabase
        .from('vports')
        .select('id,name,avatar_url,created_by,created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      if (ownedErr) throw ownedErr;

      // MANAGED (correct column + correct FK join)
      const { data: managedRows, error: managedErr } = await supabase
        .from('vport_managers')
        .select('vport_id, created_at, vport:vports!vport_managers_vport_id_fkey(id,name,avatar_url)')
        .eq('manager_user_id', user.id);
      if (managedErr) throw managedErr;

      const managed = (managedRows ?? [])
        .map(r => r.vport)
        .filter(Boolean);

      // Merge + dedupe
      const map = new Map();
      for (const v of (owned ?? [])) {
        map.set(v.id, { id: v.id, name: v.name ?? 'VPORT', avatar_url: v.avatar_url ?? null });
      }
      for (const v of managed) {
        map.set(v.id, { id: v.id, name: v.name ?? 'VPORT', avatar_url: v.avatar_url ?? null });
      }

      setVports(Array.from(map.values()));
      setError(null);
    } catch (e) {
      setError(e);
      setVports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [user?.id]);

  return { vports, loading, error, refresh: load };
}
