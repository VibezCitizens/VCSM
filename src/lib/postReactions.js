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
 * - counts: { like, dislike, rose }               // rose kept for compatibility; can be 0 here
 * - userReaction: 'like' | 'dislike' | 'rose' | null
 * - toggle(type): toggles current identity's reaction (like/dislike)
 * - reload(): refetch from DB
 *
 * Schema note:
 * - One row per (post_id, actor_id). Column 'reaction' stores the value.
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

      const { data, error } = await supabase
        .schema('vc')
        .from('post_reactions')
        .select('reaction, actor_id')
        .eq('post_id', postId);

      if (error) throw error;

      const agg = { like: 0, dislike: 0, rose: 0 };
      let mine = null;

      for (const r of data || []) {
        if (r.reaction === 'like') agg.like += 1;
        else if (r.reaction === 'dislike') agg.dislike += 1;
        else if (r.reaction === 'rose') agg.rose += 1; // optional; roses often handled elsewhere

        if (aId && r.actor_id === aId && LD.includes(r.reaction)) {
          mine = r.reaction;
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

      // Current row (if any) for this actor/post
      const { data: existing, error: selErr } = await supabase
        .schema('vc')
        .from('post_reactions')
        .select('reaction')
        .eq('post_id', postId)
        .eq('actor_id', aId)
        .maybeSingle();
      if (selErr && selErr.code !== 'PGRST116') throw selErr;

      // If same selected reaction → remove it (delete row)
      if (existing?.reaction === type) {
        const { error: delErr } = await supabase
          .schema('vc')
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('actor_id', aId);
        if (delErr) throw delErr;

        setUserReaction(null);
        setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
        return;
      }

      // Else, set/flip reaction (update if exists, else insert)
      if (existing) {
        const { error: upErr } = await supabase
          .schema('vc')
          .from('post_reactions')
          .update({ reaction: type, updated_at: new Date().toISOString() })
          .eq('post_id', postId)
          .eq('actor_id', aId);
        if (upErr) throw upErr;

        // adjust counts
        if (LD.includes(existing.reaction)) {
          setCounts((c) => ({
            ...c,
            [existing.reaction]: Math.max(0, c[existing.reaction] - 1),
            [type]: c[type] + 1,
          }));
        } else {
          setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
        }
      } else {
        const { error: insErr } = await supabase
          .schema('vc')
          .from('post_reactions')
          .insert({ post_id: postId, actor_id: aId, reaction: type, updated_at: new Date().toISOString() });
        if (insErr) throw insErr;

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

  const { data: existing, error: selErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('reaction')
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') throw selErr;

  if (existing?.reaction === type) {
    const { error: delErr } = await supabase
      .schema('vc')
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('actor_id', actorId);
    if (delErr) throw delErr;
    return { changed: true, removed: true, type };
  }

  if (existing) {
    const { error: upErr } = await supabase
      .schema('vc')
      .from('post_reactions')
      .update({ reaction: type, updated_at: new Date().toISOString() })
      .eq('post_id', postId)
      .eq('actor_id', actorId);
    if (upErr) throw upErr;
  } else {
    const { error: insErr } = await supabase
      .schema('vc')
      .from('post_reactions')
      .insert({ post_id: postId, actor_id: actorId, reaction: type, updated_at: new Date().toISOString() });
    if (insErr) throw insErr;
  }
  return { changed: true, removed: false, type };
}

/**
 * Send (add) a 'rose' for the current identity on a post.
 * With single-row model, a second 'rose' would overwrite the reaction.
 * Since you handle roses elsewhere in `roses.js`, this stays lightweight.
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

  // Optional: enforce user→user only outside of this DAL.

  // If you truly want roses to be separate from like/dislike, consider a dedicated table.
  const { error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .insert({ post_id: postId, actor_id: actorId, reaction: 'rose', updated_at: new Date().toISOString() });

  if (error) throw error;
  return { ok: true, reaction: 'rose' };
}
