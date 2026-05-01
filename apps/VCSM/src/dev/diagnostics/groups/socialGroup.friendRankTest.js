import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { resolveTargetActorId } from "@/dev/diagnostics/groups/social.group.helpers";

const GROUP_ID = "social";

export const friendRankWriteTest = {
  id: buildTestId(GROUP_ID, "friend_rank_write"),
  name: "friend_ranks write/read path",
  run: async ({ shared: localShared }) => {
    const { actorId } = await ensureActorContext(localShared);
    const targetActorId = await resolveTargetActorId(localShared);

    if (!targetActorId || targetActorId === actorId) {
      return makeSkipped("No second actor available to test friend ranks");
    }

    const { error: ensureFollowError } = await supabase
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

    if (ensureFollowError) throw ensureFollowError;

    const { data: rpcData, error: rpcError } = await supabase
      .schema("vc")
      .rpc("save_friend_ranks", {
        p_owner_actor_id: actorId,
        p_friend_actor_ids: [targetActorId],
        p_autofill: false,
        p_max_count: 10,
      });

    let writeMode = "rpc";
    let writeError = null;

    if (rpcError) {
      writeError = rpcError;
      writeMode = isMissingRpc(rpcError) ? "fallback_direct_missing_rpc" : "fallback_direct_rpc_error";

      const { error: deleteError } = await supabase
        .schema("vc")
        .from("friend_ranks")
        .delete()
        .eq("owner_actor_id", actorId);

      if (deleteError) {
        if (isPermissionDenied(deleteError)) {
          return makeSkipped(
            "friend_ranks write blocked (rpc failed and fallback delete denied)",
            { ownerActorId: actorId, friendActorId: targetActorId, rpcError, fallbackDeleteError: deleteError }
          );
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
          return makeSkipped(
            "friend_ranks write blocked (rpc failed and fallback insert denied)",
            { ownerActorId: actorId, friendActorId: targetActorId, rpcError, fallbackInsertError: insertError }
          );
        }
        throw insertError;
      }
    }

    const { data: rankRows, error: rankReadError } = await supabase
      .schema("vc")
      .from("friend_ranks")
      .select("owner_actor_id,friend_actor_id,rank")
      .eq("owner_actor_id", actorId)
      .order("rank", { ascending: true })
      .limit(10);

    if (rankReadError) throw rankReadError;

    const candidateIds = [];
    const seenCandidateIds = new Set();
    for (const row of rankRows ?? []) {
      const id = row?.friend_actor_id;
      if (!id || seenCandidateIds.has(id)) continue;
      seenCandidateIds.add(id);
      candidateIds.push(id);
    }

    let activeFollowRows = [];
    let actorRows = [];

    if (candidateIds.length > 0) {
      const { data: followRows, error: followReadError } = await supabase
        .schema("vc")
        .from("actor_follows")
        .select("followed_actor_id,is_active")
        .eq("follower_actor_id", actorId)
        .eq("is_active", true)
        .in("followed_actor_id", candidateIds);

      if (followReadError) throw followReadError;
      activeFollowRows = followRows ?? [];

      const { data: fetchedActorRows, error: actorReadError } = await supabase
        .schema("vc")
        .from("actors")
        .select("id,is_void")
        .in("id", candidateIds);

      if (actorReadError) throw actorReadError;
      actorRows = fetchedActorRows ?? [];
    }

    const activeFollowSet = new Set(
      activeFollowRows.map((row) => row?.followed_actor_id).filter(Boolean)
    );
    const activeActorSet = new Set(
      actorRows.filter((row) => row?.id && row?.is_void !== true).map((row) => row.id)
    );
    const topFriendActorIds = candidateIds.filter(
      (id) => id && id !== actorId && activeFollowSet.has(id) && activeActorSet.has(id)
    );

    return {
      ownerActorId: actorId,
      targetActorId,
      writeMode,
      writeError,
      rpcRows: Array.isArray(rpcData) ? rpcData : [],
      rankCount: Array.isArray(rankRows) ? rankRows.length : 0,
      rankRows: rankRows ?? [],
      topFriendActorIds,
    };
  },
};
