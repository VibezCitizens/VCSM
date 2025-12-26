import { supabase } from '@/services/supabase/supabaseClient';

export async function loadBlockSets(myActorId) {
  if (!myActorId) {
    return { iBlocked: new Set(), blockedMe: new Set() };
  }

  const [{ data: a }, { data: b }] = await Promise.all([
    supabase.schema('vc')
      .from('user_blocks')
      .select('blocked_actor_id')
      .eq('blocker_actor_id', myActorId),

    supabase.schema('vc')
      .from('user_blocks')
      .select('blocker_actor_id')
      .eq('blocked_actor_id', myActorId),
  ]);

  return {
    iBlocked: new Set((a ?? []).map(r => r.blocked_actor_id)),
    blockedMe: new Set((b ?? []).map(r => r.blocker_actor_id)),
  };
}

export function filterByBlocks(rows, blocks) {
  return rows.filter(r => {
    if (!r.actor_id) return true;
    if (blocks.iBlocked.has(r.actor_id)) return false;
    if (blocks.blockedMe.has(r.actor_id)) return false;
    return true;
  });
}
