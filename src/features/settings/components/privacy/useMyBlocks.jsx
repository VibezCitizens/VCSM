// src/features/settings/components/privacy/useMyBlocks.jsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import { vc } from '@/lib/vcClient';

const Ctx = createContext(null);

export function MyBlocksProvider({ actorId, userId, vportId, children }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!actorId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const { data: rows, error: bErr } = await vc
        .from('user_blocks')
        .select('blocked_actor_id, created_at, reason')
        .eq('blocker_actor_id', actorId)
        .order('created_at', { ascending: false });

      if (bErr) throw bErr;

      const actorIds = [...new Set((rows || []).map(r => r.blocked_actor_id))];
      if (actorIds.length === 0) {
        setBlocks([]);
        return;
      }

      const { data: actors, error: aErr } = await vc
        .from('actors')
        .select('id, kind, profile_id, vport_id')
        .in('id', actorIds);

      if (aErr) throw aErr;

      const profileIds = actors.filter(a => a.profile_id).map(a => a.profile_id);
      const vportIds   = actors.filter(a => a.vport_id).map(a => a.vport_id);

      const [profilesResp, vportsResp] = await Promise.all([
        profileIds.length
          ? supabase.from('profiles').select('id, display_name, username, photo_url')
                    .in('id', profileIds)
          : { data: [], error: null },
        vportIds.length
          ? vc.from('vports').select('id, name, slug, avatar_url')
               .in('id', vportIds)
          : { data: [], error: null },
      ]);

      if (profilesResp.error) throw profilesResp.error;
      if (vportsResp.error) throw vportsResp.error;

      const profMap  = new Map(profilesResp.data.map(p => [p.id, p]));
      const vportMap = new Map(vportsResp.data.map(v => [v.id, v]));

      const cardByActor = new Map();

      for (const a of actors) {
        if (a.profile_id && profMap.has(a.profile_id)) {
          const p = profMap.get(a.profile_id);
          cardByActor.set(a.id, {
            actorId: a.id,
            kind: 'user',
            profileId: p.id,
            vportId: null,
            title: p.display_name || p.username || 'Unknown',
            subtitle: p.username ? `@${p.username}` : '',
            avatarUrl: p.photo_url || '/avatar.jpg',
          });
        } else if (a.vport_id && vportMap.has(a.vport_id)) {
          const v = vportMap.get(a.vport_id);
          cardByActor.set(a.id, {
            actorId: a.id,
            kind: 'vport',
            profileId: null,
            vportId: v.id,
            title: v.name || 'Untitled VPORT',
            subtitle: v.slug ? `/${v.slug}` : '',
            avatarUrl: v.avatar_url || '/avatar.jpg',
          });
        }
      }

      const index = new Map(rows.map((r, i) => [r.blocked_actor_id, i]));
      const ordered = actorIds
        .map(id => cardByActor.get(id))
        .filter(Boolean)
        .sort((a, b) => index.get(a.actorId) - index.get(b.actorId));

      setBlocks(ordered);
    } catch (e) {
      setErr(e.message);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => { load(); }, [load]);

  const isBlockedByActor = useCallback(
    (actorId) => blocks.some(b => b.actorId === actorId),
    [blocks]
  );

  // ---- RESOLVE PROFILE OR VPORT TO ACTOR ----
  async function resolveActorId(id, type) {
    if (type === 'profile') {
      const { data, error } = await vc
        .from('actors')
        .select('id')
        .eq('profile_id', id)
        .maybeSingle();
      if (error || !data) throw new Error('Profile actor not found.');
      return data.id;
    }

    if (type === 'vport') {
      const { data, error } = await vc
        .from('actors')
        .select('id')
        .eq('vport_id', id)
        .maybeSingle();
      if (error || !data) throw new Error('VPORT actor not found.');
      return data.id;
    }

    throw new Error('Invalid type for resolveActorId');
  }

  const blockByActor = useCallback(
    async (blockedActorId) => {
      const { error } = await vc
        .from('user_blocks')
        .insert([{ blocker_actor_id: actorId, blocked_actor_id: blockedActorId }]);
      if (error) throw error;
      await load();
      return true;
    },
    [actorId, load]
  );

  const unblockByActor = useCallback(
    async (blockedActorId) => {
      const { error } = await vc
        .from('user_blocks')
        .delete()
        .match({ blocker_actor_id: actorId, blocked_actor_id: blockedActorId });

      if (error) throw error;
      setBlocks(prev => prev.filter(b => b.actorId !== blockedActorId));
      return true;
    },
    [actorId]
  );

  const value = useMemo(() => ({
    actorId,
    uid: userId || null,
    vportId: vportId || null,

    blocks,
    loading,
    error: err,
    refresh: load,

    isBlockedByActor,
    resolveActorId,
    blockByActor,
    unblockByActor,
  }), [
    actorId, userId, vportId, blocks, loading, err,
    load, isBlockedByActor, resolveActorId, blockByActor, unblockByActor,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMyBlocks() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMyBlocks must be inside provider');
  return ctx;
}
