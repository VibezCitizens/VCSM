// src/data/user/post/roses.js
// 🌹 are stored in vc.post_rose_gifts (qty-based, multiple per actor).
// API:
//   count(postId) -> number (sum of qty)
//   give({ postId, qty=1, profileId?, actingAsVport?, vportId?, actorId? })

import { supabase } from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

export async function count(postId) {
  if (!postId) return 0;

  const { data, error } = await supabase
    .schema('vc')
    .from('post_rose_gifts')
    .select('qty')
    .eq('post_id', postId);

  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + (r.qty ?? 0), 0);
}

export async function give({
  postId,
  qty = 1,
  profileId,            // optional: user id
  actingAsVport = false,
  vportId = null,
  actorId: actorOverride,
} = {}) {
  if (!postId) throw new Error('roses.give: postId is required');
  if (!qty || qty <= 0) throw new Error('roses.give: qty must be > 0');

  // Resolve actor_id
  let actorId = actorOverride;
  if (!actorId) {
    let userId = profileId;
    if (!userId) {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      userId = auth?.user?.id;
    }
    if (!userId) throw new Error('roses.give: no authenticated user');

    actorId = await getCurrentActorId({
      userId,
      activeVportId: actingAsVport ? vportId : null,
    });
  }
  if (!actorId) throw new Error('roses.give: could not resolve actorId');

  const { error } = await supabase
    .schema('vc')
    .from('post_rose_gifts')
    .insert({ post_id: postId, actor_id: actorId, qty });

  if (error) throw error;
  return { ok: true };
}

const rosesApi = { count, give };
export default rosesApi;
