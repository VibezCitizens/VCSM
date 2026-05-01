import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isForeignKeyViolation,
  isPermissionDenied,
  isUniqueViolation,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { resolveTargetActorId, resolveForeignActorId } from "@/dev/diagnostics/groups/social.group.helpers";
import { friendRankWriteTest } from "@/dev/diagnostics/groups/socialGroup.friendRankTest";

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
      name: "moderation.blocks insert/release path",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const targetActorId = await resolveTargetActorId(localShared);

        if (!targetActorId || targetActorId === actorId) {
          return makeSkipped("No second actor available to test block path");
        }

        const { data: inserted, error: insertError } = await supabase
          .schema("moderation")
          .from("blocks")
          .insert({
            blocker_domain: "vc",
            blocker_actor_id: actorId,
            blocked_domain: "vc",
            blocked_actor_id: targetActorId,
            status: "active",
            meta: {},
          })
          .select("blocker_actor_id,blocked_actor_id,status,created_at")
          .maybeSingle();

        if (insertError && !isUniqueViolation(insertError)) {
          throw insertError;
        }

        const { error: releaseError } = await supabase
          .schema("moderation")
          .from("blocks")
          .update({ status: "released", released_at: new Date().toISOString() })
          .eq("blocker_actor_id", actorId)
          .eq("blocked_actor_id", targetActorId)
          .eq("status", "active");

        if (releaseError) throw releaseError;
        return {
          blockerActorId: actorId,
          blockedActorId: targetActorId,
          inserted: inserted ?? "already-existed",
          released: true,
        };
      },
    },
    friendRankWriteTest,
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
