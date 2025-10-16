// src/lib/postReactions.js

// src/features/post/usePostReactions.js
import { useCallback, useEffect, useState } from 'react';

// Be tolerant of either default or named export from supabaseClient
import * as sb from '@/lib/supabaseClient';
const supabase = sb.supabase ?? sb.default ?? sb;

import { getCurrentActorId } from '@/lib/actors/actors';

const LD = ['like', 'dislike'];

/**
 * usePostReactions(postId, opts?)
 * opts: { actingAsVport?: boolean, vportId?: string }
 * - counts: { like, dislike, rose }
 * - userReaction: 'like' | 'dislike' | 'rose' | null
 * - toggle(type): toggles current identity's reaction (like/dislike)
 * - reload(): refetch from DB
 *
 * Notes:
 * - Operates on ACTOR identity: (post_id, actor_id, type).
 * - Avoids ON CONFLICT mismatch by doing SELECT → UPDATE/INSERT for like/dislike.
 * - Roses use an upsert with onConflict = 'post_id,actor_id,type'.
 */
export function usePostReactions(postId, opts = {}) {
  const { actingAsVport = false, vportId = null } = opts;

  const [counts, setCounts] = useState({ like: 0, dislike: 0, rose: 0 });
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actorId, setActorId] = useState(null);

  // Resolve current actor (user actor or vport actor)
  const resolveActor = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id || null;
    if (!me) { setActorId(null); return null; }
    const aId = await getCurrentActorId({
      userId: me,
      activeVportId: actingAsVport ? vportId : null,
    });
    setActorId(aId ?? null);
    return aId ?? null;
  }, [actingAsVport, vportId]);

  const reload = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const aId = actorId ?? (await resolveActor());

      // fetch all reactions for this post (actor-based)
      const { data, error } = await supabase
        .schema('vc')
        .from('post_reactions')
        .select('type,actor_id,qty')
        .eq('post_id', postId);

      if (error) throw error;

      const agg = { like: 0, dislike: 0, rose: 0 };
      let mine = null;

      for (const r of data || []) {
        if (agg[r.type] !== undefined) {
          const inc = typeof r.qty === 'number' ? r.qty : 1;
          agg[r.type] += inc;
        }
        if (aId && r.actor_id === aId && LD.includes(r.type)) {
          mine = r.type;
        }
      }

      setCounts(agg);
      setUserReaction(mine);
    } finally {
      setLoading(false);
    }
  }, [postId, actorId, resolveActor]);

  // Toggle like/dislike for current actor
  const toggle = useCallback(
    async (type) => {
      if (!postId || !LD.includes(type)) return;

      const aId = actorId ?? (await resolveActor());
      if (!aId) return;

      // If same selected reaction → remove it
      if (userReaction === type) {
        const { error: delErr } = await supabase
          .schema('vc')
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('actor_id', aId)
          .eq('type', type);
        if (delErr) throw delErr;

        setUserReaction(null);
        setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
        return;
      }

      // Else, set/flip reaction using SELECT → UPDATE/INSERT (no upsert conflict)
      const { data: existing, error: selErr } = await supabase
        .schema('vc')
        .from('post_reactions')
        .select('id, type')
        .eq('post_id', postId)
        .eq('actor_id', aId)
        .in('type', LD)
        .maybeSingle();
      if (selErr && selErr.code !== 'PGRST116') throw selErr;

      if (existing?.id) {
        if (existing.type !== type) {
          const { error: upErr } = await supabase
            .schema('vc')
            .from('post_reactions')
            .update({ type })
            .eq('id', existing.id);
          if (upErr) throw upErr;

          setCounts((c) => ({
            ...c,
            [existing.type]: Math.max(0, c[existing.type] - 1),
            [type]: c[type] + 1,
          }));
        }
      } else {
        const { error: insErr } = await supabase
          .schema('vc')
          .from('post_reactions')
          .insert({ post_id: postId, actor_id: aId, type, qty: 1 });
        if (insErr) throw insErr;

        if (userReaction) {
          setCounts((c) => ({ ...c, [userReaction]: Math.max(0, c[userReaction] - 1) }));
        }
        setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
      }

      setUserReaction(type);
    },
    [postId, userReaction, actorId, resolveActor]
  );

  useEffect(() => {
    (async () => {
      await resolveActor();
      await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, actingAsVport, vportId]);

  return { counts, userReaction, loading, toggle, reload };
}

/**
 * Non-hook utilities
 * These resolve the current ACTOR internally via supabase.auth.getUser() + getCurrentActorId()
 */

/** Toggle a reaction (like/dislike) for the current identity on a post */
export async function toggleReaction(postId, type, opts = {}) {
  if (!postId || !type) throw new Error('toggleReaction requires postId and type');
  if (!LD.includes(type)) throw new Error('toggleReaction: type must be like|dislike');

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const me = auth?.user?.id;
  if (!me) throw new Error('Not authenticated');

  const actingAsVport = !!opts.actingAsVport;
  const vportId = opts.vportId || null;

  const actorId = await getCurrentActorId({ userId: me, activeVportId: actingAsVport ? vportId : null });
  if (!actorId) throw new Error('toggleReaction: no actor for current identity');

  // current reaction?
  const { data: mine, error: mineErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('id, type')
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .in('type', LD)
    .maybeSingle();
  if (mineErr && mineErr.code !== 'PGRST116') throw mineErr;

  // same type => remove it
  if (mine?.type === type) {
    const { error: delErr } = await supabase
      .schema('vc')
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('actor_id', actorId)
      .eq('type', type);
    if (delErr) throw delErr;
    return { changed: true, removed: true, type };
  }

  // else set/flip (no upsert; select → update/insert)
  if (mine?.id) {
    const { error: upErr } = await supabase
      .schema('vc')
      .from('post_reactions')
      .update({ type })
      .eq('id', mine.id);
    if (upErr) throw upErr;
  } else {
    const { error: insErr } = await supabase
      .schema('vc')
      .from('post_reactions')
      .insert({ post_id: postId, actor_id: actorId, type, qty: 1 });
    if (insErr) throw insErr;
  }
  return { changed: true, removed: false, type };
}

/**
 * Send (add) a 'rose' for the current identity on a post.
 * This uses an upsert on (post_id, actor_id, type). If you want to increment
 * the qty on repeated sends, switch to DO UPDATE qty = qty + EXCLUDED.qty.
 */
export async function sendRose(postId, opts = {}) {
  if (!postId) throw new Error('sendRose requires postId');

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const me = auth?.user?.id;
  if (!me) throw new Error('Not authenticated');

  const actingAsVport = !!opts.actingAsVport;
  const vportId = opts.vportId || null;

  const actorId = await getCurrentActorId({ userId: me, activeVportId: actingAsVport ? vportId : null });
  if (!actorId) throw new Error('sendRose: no actor for current identity');

  const { error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .insert({ post_id: postId, actor_id: actorId, type: 'rose', qty: 1 });

  if (error) throw error;
  return { ok: true, type: 'rose' };
}
