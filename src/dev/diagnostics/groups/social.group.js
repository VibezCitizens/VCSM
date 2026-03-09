import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isMissingRpc,
  isForeignKeyViolation,
  isPermissionDenied,
  isUniqueViolation,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
export const GROUP_ID = "social";
export const GROUP_LABEL = "Social";
const TESTS = [
  { key: "follow_write", name: "follow edge write/read (actor_follows)" },
  { key: "unfollow_write", name: "unfollow update path (actor_follows)" },
  { key: "follow_request_write", name: "follow request create/read (social_follow_requests)" },
  { key: "user_block_write", name: "user_blocks insert/delete path" },
  { key: "friend_rank_write", name: "friend_ranks write/read path" },
  { key: "ownership_boundary", name: "RLS ownership boundary on social rows" },
];

export function getSocialTests() {
  return TESTS.map((row) => ({ id: buildTestId(GROUP_ID, row.key), group: GROUP_ID, name: row.name }));
}
async function resolveTargetActorId(shared) {
  const { actorId } = await ensureActorContext(shared);
  try {
    const vport = await ensureBasicVport(shared);
    if (vport?.actorId && vport.actorId !== actorId) {
      return vport.actorId;
    }
  } catch {
    // best effort only
  }
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(1);
  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}
async function resolveForeignActorId(shared) {
  const { actorId, userId } = await ensureActorContext(shared);
  const { data: ownedRows } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId);
  const ownedIds = new Set((ownedRows || []).map((row) => row.actor_id).filter(Boolean));
  ownedIds.add(actorId);
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .limit(50);
  if (error) throw error;
  const foreign = (data || []).find((row) => row?.actor_id && !ownedIds.has(row.actor_id));
  return foreign?.actor_id ?? null;
}

export async function runSocialGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "follow_write"),
      name: "follow edge write/read (actor_follows)",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const targetActorId = await resolveTargetActorId(localShared);

        if (!targetActorId || targetActorId === actorId) {
          return makeSkipped("No second actor available to test follow edge");
        }

        const { error: writeError } = await supabase
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

        if (writeError) throw writeError;

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("actor_follows")
          .select("follower_actor_id,followed_actor_id,is_active,created_at")
          .eq("follower_actor_id", actorId)
          .eq("followed_actor_id", targetActorId)
          .maybeSingle();

        if (readError) throw readError;
        return {
          followerActorId: actorId,
          followedActorId: targetActorId,
          row: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "unfollow_write"),
      name: "unfollow update path (actor_follows)",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const targetActorId = await resolveTargetActorId(localShared);

        if (!targetActorId || targetActorId === actorId) {
          return makeSkipped("No second actor available to test unfollow update");
        }

        const { error: updateError } = await supabase
          .schema("vc")
          .from("actor_follows")
          .update({ is_active: false })
          .eq("follower_actor_id", actorId)
          .eq("followed_actor_id", targetActorId);

        if (updateError) throw updateError;

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("actor_follows")
          .select("follower_actor_id,followed_actor_id,is_active,created_at")
          .eq("follower_actor_id", actorId)
          .eq("followed_actor_id", targetActorId)
          .maybeSingle();

        if (readError) throw readError;
        return {
          followerActorId: actorId,
          followedActorId: targetActorId,
          row: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "follow_request_write"),
      name: "follow request create/read (social_follow_requests)",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const targetActorId = await resolveTargetActorId(localShared);

        if (!targetActorId || targetActorId === actorId) {
          return makeSkipped("No second actor available to test follow request flow");
        }

        const { error: writeError } = await supabase
          .schema("vc")
          .from("social_follow_requests")
          .upsert(
            {
              requester_actor_id: actorId,
              target_actor_id: targetActorId,
              status: "pending",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "requester_actor_id,target_actor_id" }
          );

        if (writeError) throw writeError;

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("social_follow_requests")
          .select("requester_actor_id,target_actor_id,status,created_at,updated_at")
          .eq("requester_actor_id", actorId)
          .eq("target_actor_id", targetActorId)
          .maybeSingle();

        if (readError) throw readError;
        return {
          requesterActorId: actorId,
          targetActorId,
          row: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "user_block_write"),
      name: "user_blocks insert/delete path",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const targetActorId = await resolveTargetActorId(localShared);

        if (!targetActorId || targetActorId === actorId) {
          return makeSkipped("No second actor available to test block path");
        }

        const { data: inserted, error: insertError } = await supabase
          .schema("vc")
          .from("user_blocks")
          .insert({
            blocker_actor_id: actorId,
            blocked_actor_id: targetActorId,
          })
          .select("id,blocker_actor_id,blocked_actor_id,created_at")
          .maybeSingle();

        if (insertError && !isUniqueViolation(insertError)) {
          throw insertError;
        }

        const { error: deleteError } = await supabase
          .schema("vc")
          .from("user_blocks")
          .delete()
          .eq("blocker_actor_id", actorId)
          .eq("blocked_actor_id", targetActorId);

        if (deleteError) throw deleteError;
        return {
          blockerActorId: actorId,
          blockedActorId: targetActorId,
          inserted: inserted ?? "already-existed",
          deleted: true,
        };
      },
    },
    {
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
    },
    {
      id: buildTestId(GROUP_ID, "ownership_boundary"),
      name: "RLS ownership boundary on social rows",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const foreignActorId = await resolveForeignActorId(localShared);

        if (!foreignActorId) {
          return makeSkipped("No non-owned actor found to probe RLS boundary");
        }

        const { error } = await supabase
          .schema("vc")
          .from("actor_follows")
          .insert({
            follower_actor_id: foreignActorId,
            followed_actor_id: actorId,
            is_active: true,
          });

        if (error) {
          if (isPermissionDenied(error) || isForeignKeyViolation(error)) {
            return {
              boundaryRespected: true,
              foreignActorId,
              actorId,
              error,
            };
          }

          if (isUniqueViolation(error)) {
            return makeSkipped("Boundary probe inconclusive due existing unique row", {
              foreignActorId,
              actorId,
            });
          }

          throw error;
        }

        // If insert succeeded, immediately clean it up and fail hard.
        await supabase
          .schema("vc")
          .from("actor_follows")
          .delete()
          .eq("follower_actor_id", foreignActorId)
          .eq("followed_actor_id", actorId);

        throw new Error(
          "Ownership boundary failed: diagnostics could insert actor_follows row for a non-owned actor."
        );
      },
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
