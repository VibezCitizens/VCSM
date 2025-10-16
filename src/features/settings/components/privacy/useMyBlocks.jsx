// src/features/settings/components/privacy/useMyBlocks.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import { vc } from '@/lib/vcClient';

const Ctx = createContext(null);

export function MyBlocksProvider({ children }) {
  const [uid, setUid] = useState(null);
  const [blocks, setBlocks] = useState([]); // array of profile rows
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // load session user
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUid(data?.user?.id || null);
    })();
    return () => { alive = false; };
  }, []);

  const load = useCallback(async () => {
    if (!uid) { setBlocks([]); setLoading(false); return; }
    setLoading(true);
    setErr('');
    try {
      // who I blocked
      const { data: rows, error: bErr } = await vc
        .from('user_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', uid)
        .order('created_at', { ascending: false });
      if (bErr) throw bErr;

      const ids = [...new Set((rows || []).map(r => r.blocked_id))];
      if (ids.length === 0) {
        setBlocks([]);
        return;
      }

      // fetch their profiles
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name, username, photo_url')
        .in('id', ids);
      if (pErr) throw pErr;

      // keep order by created_at (most recent first)
      const index = new Map(ids.map((id, i) => [id, i]));
      const ordered = (profs || []).slice().sort((a, b) => {
        return (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
      });

      setBlocks(ordered);
    } catch (e) {
      setErr(e?.message || 'Failed to load blocked users.');
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const isBlocked = useCallback((profileId) => {
    if (!profileId) return false;
    return blocks.some(p => p.id === profileId);
  }, [blocks]);

  const block = useCallback(async (profileId) => {
    if (!uid || !profileId) return false;
    try {
      // server first (avoid RLS races)
      const { error } = await vc
        .from('user_blocks')
        .insert([{ blocker_id: uid, blocked_id: profileId, reason: null }]);
      if (error) throw error;

      // optimistic enrich (only if not already present)
      if (!isBlocked(profileId)) {
        const { data: prof, error: pErr } = await supabase
          .from('profiles')
          .select('id, display_name, username, photo_url')
          .eq('id', profileId)
          .maybeSingle();
        if (pErr) throw pErr;
        if (prof) setBlocks(prev => [prof, ...prev]);
      }
      return true;
    } catch (e) {
      setErr(e?.message || 'Block failed.');
      return false;
    }
  }, [uid, isBlocked]);

  const unblock = useCallback(async (profileId) => {
    if (!uid || !profileId) return false;
    try {
      const { error } = await vc
        .from('user_blocks')
        .delete()
        .match({ blocker_id: uid, blocked_id: profileId });
      if (error) throw error;

      // optimistic remove
      setBlocks(prev => prev.filter(p => p.id !== profileId));
      return true;
    } catch (e) {
      setErr(e?.message || 'Unblock failed.');
      return false;
    }
  }, [uid]);

  const value = useMemo(() => ({
    uid,
    blocks,
    loading,
    error: err,
    refresh: load,
    isBlocked,
    block,
    unblock,
  }), [uid, blocks, loading, err, load, isBlocked, block, unblock]);

  // No JSX to keep .js extension safe:
  return React.createElement(Ctx.Provider, { value }, children);
}

export function useMyBlocks() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMyBlocks must be used inside <MyBlocksProvider>');
  return ctx;
}
