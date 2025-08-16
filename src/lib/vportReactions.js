// src/lib/vpReactions.js
import { supabase } from '@/lib/supabaseClient';

async function getUID() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

/** Get like/dislike counts + my reaction for a vport_post */
export async function fetchVPReactionState(vportPostId) {
  const uid = await getUID();

  // denorm counters
  const { data: postRow, error: pErr } = await supabase
    .from('vport_posts')
    .select('like_count, dislike_count')
    .eq('id', vportPostId)
    .maybeSingle();
  if (pErr) throw pErr;

  // my reaction
  let myReaction = null;
  if (uid) {
    const { data: myRow, error: rErr } = await supabase
      .from('vport_post_reactions')
      .select('reaction')
      .eq('vport_post_id', vportPostId)
      .eq('user_id', uid)
      .maybeSingle();
    if (!rErr && myRow?.reaction) myReaction = myRow.reaction;
  }

  return {
    likeCount: Number(postRow?.like_count ?? 0),
    dislikeCount: Number(postRow?.dislike_count ?? 0),
    myReaction,
  };
}

/** Set my reaction: 'like' | 'dislike' | null (remove) */
export async function setVPReaction(vportPostId, next) {
  const uid = await getUID();
  if (!uid) throw new Error('Not signed in');

  if (next === null) {
    const { error } = await supabase
      .from('vport_post_reactions')
      .delete()
      .eq('vport_post_id', vportPostId)
      .eq('user_id', uid);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('vport_post_reactions')
    .upsert(
      [{ vport_post_id: vportPostId, user_id: uid, reaction: next }],
      { onConflict: 'vport_post_id,user_id' }
    );
  if (error) throw error;
}

/** Live counters via UPDATEs to vport_posts fired by your trigger */
export function subscribeVPostCounters(vportPostId, onPatch) {
  const ch = supabase
    .channel(`vp_counters_${vportPostId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vport_posts', filter: `id=eq.${vportPostId}` },
      (payload) => {
        const n = payload.new;
        onPatch?.({
          likeCount: Number(n.like_count ?? 0),
          dislikeCount: Number(n.dislike_count ?? 0),
        });
      }
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}
