import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Enforces post-level visibility for a viewer.
 * Always runs privacy check. Block + follow checks only fire when viewerActorId
 * is known. Null viewer sees public posts only (private posts denied).
 *
 * Returns { canView: boolean, reason: string }.
 * Fails open (canView: true) only when postActorId is missing (no post to gate).
 */
export async function checkPostVisibilityDAL({ postActorId, viewerActorId }) {
  if (!postActorId) return { canView: true, reason: "no_context" };
  if (viewerActorId && postActorId === viewerActorId) return { canView: true, reason: "owner" };

  // Block check fires only when viewer is known (needs bidirectional query with viewer ID).
  // Privacy check always fires — needed for null-viewer public/private determination.
  // RLS (blocks_select_own + blocks_select_blocked after migration 20260510010000)
  // makes both block directions visible to the viewer.
  const [blockResult, privacyResult] = await Promise.all([
    viewerActorId
      ? supabase
          .schema("moderation")
          .from("blocks")
          .select("blocker_actor_id")
          .eq("status", "active")
          .eq("blocker_domain", "vc")
          .eq("blocked_domain", "vc")
          .or(
            `and(blocker_actor_id.eq.${viewerActorId},blocked_actor_id.eq.${postActorId}),` +
            `and(blocker_actor_id.eq.${postActorId},blocked_actor_id.eq.${viewerActorId})`
          )
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .schema("vc")
      .from("actor_privacy_settings")
      .select("is_private")
      .eq("actor_id", postActorId)
      .maybeSingle(),
  ]);

  if (viewerActorId && blockResult.data) return { canView: false, reason: "blocked" };

  const isPrivate = Boolean(privacyResult.data?.is_private);
  if (!isPrivate) return { canView: true, reason: "public" };

  // Private author — null viewer has no follow relationship possible
  if (!viewerActorId) return { canView: false, reason: "private_no_viewer" };

  const { data: followRow } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("is_active")
    .eq("follower_actor_id", viewerActorId)
    .eq("followed_actor_id", postActorId)
    .maybeSingle();

  return followRow?.is_active
    ? { canView: true, reason: "following" }
    : { canView: false, reason: "private_not_following" };
}
