import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";
import { isMissingRpc, isPermissionDenied } from "@/dev/diagnostics/helpers/supabaseAssert";
import { blockActorController, unblockActorController } from "@/features/block/controllers/blockActor.controller";

export function getState(shared) {
  if (!shared.cache.blockState) {
    shared.cache.blockState = {};
  }
  return shared.cache.blockState;
}

export async function resolveTargetActorId(shared) {
  const { actorId } = await ensureActorContext(shared);

  try {
    const vport = await ensureBasicVport(shared);
    if (vport?.actorId && vport.actorId !== actorId) {
      return vport.actorId;
    }
  } catch {
    // best effort fallback below
  }

  const { data, error } = await supabase
    .schema("identity")
    .from("actor_directory")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(20);

  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

export async function ensurePair(shared) {
  const state = getState(shared);
  if (state.actorId && state.targetActorId) {
    return { actorId: state.actorId, targetActorId: state.targetActorId };
  }

  const { actorId } = await ensureActorContext(shared);
  const targetActorId = await resolveTargetActorId(shared);

  if (!targetActorId || targetActorId === actorId) {
    return null;
  }

  state.actorId = actorId;
  state.targetActorId = targetActorId;
  return { actorId, targetActorId };
}

export async function ensureUnblocked(actorId, targetActorId) {
  try {
    await unblockActorController(actorId, targetActorId);
  } catch {
    // best effort cleanup only
  }
}

export async function ensureBlocked(actorId, targetActorId) {
  await blockActorController(actorId, targetActorId);
}

export async function ensureFriendRankRow(actorId, targetActorId) {
  const { error: followError } = await supabase
    .schema("vc")
    .from("actor_follows")
    .upsert(
      {
        follower_actor_id: actorId,
        followed_actor_id: targetActorId,
        is_active: true,
      },
      { onConflict: "follower_actor_id,followed_actor_id" }
    );

  if (followError) throw followError;

  const { error: rpcError } = await supabase
    .schema("vc")
    .rpc("save_friend_ranks", {
      p_owner_actor_id: actorId,
      p_friend_actor_ids: [targetActorId],
      p_autofill: false,
      p_max_count: 10,
    });

  if (!rpcError) return { mode: "rpc" };

  const { error: deleteError } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .delete()
    .eq("owner_actor_id", actorId);
  if (deleteError) {
    if (isPermissionDenied(deleteError) || isMissingRpc(rpcError)) {
      return { mode: "skip", rpcError, deleteError };
    }
    throw deleteError;
  }

  const { error: insertError } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .insert({
      owner_actor_id: actorId,
      friend_actor_id: targetActorId,
      rank: 1,
    });
  if (insertError) {
    if (isPermissionDenied(insertError)) {
      return { mode: "skip", rpcError, insertError };
    }
    throw insertError;
  }

  return { mode: "fallback", rpcError };
}
