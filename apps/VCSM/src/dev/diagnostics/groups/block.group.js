import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isMissingRpc,
  isPermissionDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  blockActorController,
  toggleBlockActorController,
  unblockActorController,
} from "@/features/block/controllers/blockActor.controller";
import { ctrlGetBlockStatus } from "@/features/block/controllers/getBlockStatus.controller";
import { ctrlGetBlockedActorSet } from "@/features/block/controllers/getBlockedActorSet.controller";
import {
  fetchActorsIBlocked,
  fetchActorsWhoBlockedMe,
  fetchBlockGraph,
} from "@/features/block/dal/block.read.dal";

export const GROUP_ID = "block";
export const GROUP_LABEL = "Block";

const TESTS = [
  { key: "status_read", name: "read block status via controller" },
  { key: "block_write", name: "block actor via controller" },
  { key: "read_graph", name: "read blocked graph/list paths" },
  { key: "unblock_write", name: "unblock actor via controller" },
  { key: "toggle_flow", name: "toggle block flow" },
  { key: "side_effect_follow_cleanup", name: "block side-effect removes actor_follows edges" },
  { key: "side_effect_friend_rank_cleanup", name: "block side-effect removes friend_ranks edges" },
  { key: "filter_candidates", name: "filter blocked candidates path" },
];

export function getBlockTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getState(shared) {
  if (!shared.cache.blockState) {
    shared.cache.blockState = {};
  }
  return shared.cache.blockState;
}

async function resolveTargetActorId(shared) {
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
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(20);

  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

async function ensurePair(shared) {
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

async function ensureUnblocked(actorId, targetActorId) {
  try {
    await unblockActorController(actorId, targetActorId);
  } catch {
    // best effort cleanup only
  }
}

async function ensureBlocked(actorId, targetActorId) {
  await blockActorController(actorId, targetActorId);
}

async function ensureFriendRankRow(actorId, targetActorId) {
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

export async function runBlockGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "status_read"),
      name: "read block status via controller",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        const status = await ctrlGetBlockStatus({
          actorId: pair.actorId,
          targetActorId: pair.targetActorId,
        });

        return { ...pair, status };
      },
    },
    {
      id: buildTestId(GROUP_ID, "block_write"),
      name: "block actor via controller",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        await ensureBlocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = true;

        const status = await ctrlGetBlockStatus({
          actorId: pair.actorId,
          targetActorId: pair.targetActorId,
        });

        return { ...pair, status };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_graph"),
      name: "read blocked graph/list paths",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        await ensureBlocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = true;

        const [iBlocked, blockedMe, graph] = await Promise.all([
          fetchActorsIBlocked(pair.actorId),
          fetchActorsWhoBlockedMe(pair.actorId),
          fetchBlockGraph(pair.actorId),
        ]);

        return {
          ...pair,
          iBlockedCount: iBlocked.length,
          blockedMeCount: blockedMe.length,
          hasTargetInIBlocked: iBlocked.includes(pair.targetActorId),
          graph: {
            iBlockedCount: graph.iBlocked?.size ?? 0,
            blockedMeCount: graph.blockedMe?.size ?? 0,
            hasTargetInIBlocked: graph.iBlocked?.has(pair.targetActorId) ?? false,
          },
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "unblock_write"),
      name: "unblock actor via controller",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        await ensureUnblocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = false;

        const status = await ctrlGetBlockStatus({
          actorId: pair.actorId,
          targetActorId: pair.targetActorId,
        });

        return { ...pair, status };
      },
    },
    {
      id: buildTestId(GROUP_ID, "toggle_flow"),
      name: "toggle block flow",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        const first = await toggleBlockActorController(pair.actorId, pair.targetActorId);
        const afterFirst = await ctrlGetBlockStatus({
          actorId: pair.actorId,
          targetActorId: pair.targetActorId,
        });

        const second = await toggleBlockActorController(pair.actorId, pair.targetActorId);
        const afterSecond = await ctrlGetBlockStatus({
          actorId: pair.actorId,
          targetActorId: pair.targetActorId,
        });

        getState(localShared).isBlocked = Boolean(afterSecond?.blockedByMe);

        return { ...pair, first, afterFirst, second, afterSecond };
      },
    },
    {
      id: buildTestId(GROUP_ID, "side_effect_follow_cleanup"),
      name: "block side-effect removes actor_follows edges",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        const { error: seedFollowError } = await supabase
          .schema("vc")
          .from("actor_follows")
          .upsert(
            {
              follower_actor_id: pair.actorId,
              followed_actor_id: pair.targetActorId,
              is_active: true,
            },
            { onConflict: "follower_actor_id,followed_actor_id" }
          );
        if (seedFollowError) throw seedFollowError;

        await ensureBlocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = true;

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_follows")
          .select("follower_actor_id,followed_actor_id,is_active")
          .or(
            `and(follower_actor_id.eq.${pair.actorId},followed_actor_id.eq.${pair.targetActorId}),and(follower_actor_id.eq.${pair.targetActorId},followed_actor_id.eq.${pair.actorId})`
          );
        if (error) throw error;

        await ensureUnblocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = false;

        return {
          ...pair,
          remainingEdges: data ?? [],
          edgeCountAfterBlock: Array.isArray(data) ? data.length : 0,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "side_effect_friend_rank_cleanup"),
      name: "block side-effect removes friend_ranks edges",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        const rankWrite = await ensureFriendRankRow(pair.actorId, pair.targetActorId);
        if (rankWrite.mode === "skip") {
          return makeSkipped("friend_ranks seed row unavailable for side-effect probe", rankWrite);
        }

        await ensureBlocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = true;

        const { data, error } = await supabase
          .schema("vc")
          .from("friend_ranks")
          .select("owner_actor_id,friend_actor_id,rank")
          .or(
            `and(owner_actor_id.eq.${pair.actorId},friend_actor_id.eq.${pair.targetActorId}),and(owner_actor_id.eq.${pair.targetActorId},friend_actor_id.eq.${pair.actorId})`
          );
        if (error) throw error;

        await ensureUnblocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = false;

        return {
          ...pair,
          rankWriteMode: rankWrite.mode,
          remainingRanks: data ?? [],
          rankCountAfterBlock: Array.isArray(data) ? data.length : 0,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "filter_candidates"),
      name: "filter blocked candidates path",
      run: async ({ shared: localShared }) => {
        const pair = await ensurePair(localShared);
        if (!pair) return makeSkipped("No target actor available for block diagnostics.");

        await ensureBlocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = true;

        const blockedSet = await ctrlGetBlockedActorSet({
          actorId: pair.actorId,
          candidateActorIds: [pair.targetActorId],
        });

        await ensureUnblocked(pair.actorId, pair.targetActorId);
        getState(localShared).isBlocked = false;

        const values = blockedSet instanceof Set ? [...blockedSet] : Array.isArray(blockedSet) ? blockedSet : [];
        const includesTarget = values.includes(pair.targetActorId);
        if (!includesTarget) {
          throw new Error("Blocked candidate set did not include the blocked target actor.");
        }

        return {
          ...pair,
          blockedCandidates: values,
          includesTarget,
        };
      },
    },
  ];

  try {
    return await runDiagnosticsTests({
      group: GROUP_ID,
      tests,
      onTestUpdate,
      shared,
    });
  } finally {
    const state = getState(shared);
    if (state.actorId && state.targetActorId && state.isBlocked) {
      await ensureUnblocked(state.actorId, state.targetActorId);
      state.isBlocked = false;
    }
  }
}
