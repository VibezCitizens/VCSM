// PROFILE DOMAIN NOTE:
// Posts are loaded via listActorPosts.controller
// This is the same controller used by the feed.
// DO NOT introduce profile-specific post queries here.
/**
 * ============================================================
 * Controller: listActorPosts
 * ------------------------------------------------------------
 * @SSOT: PROFILE + FEED POSTS
 *
 * This controller is the single source of truth for:
 *   • Profile → Posts tab
 *   • Profile → Photos tab
 *   • Central Feed (actor-scoped views)
 *
 * IMPORTANT:
 * - Profiles MUST use this controller
 * - Do NOT re-query posts inside profile features
 * - Actor-pure (NO profileId, NO vportId)
 * - RLS enforces visibility & privacy
 *
 * @UsedBy:
 *   - useProfileView (profile domain)
 *   - useFeed (central feed domain)
 *
 * @RefactorBatch: 2025-12
 * @Status: LOCKED
 * ============================================================
 */

import { supabase } from "@/services/supabase/supabaseClient";

export async function listActorPosts({ actorId, viewerActorId }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!viewerActorId) throw new Error("Missing viewerActorId");

  const { data, error } = await supabase
  .schema("vc")
  .from("posts")
  .select(`
    id,
    actor_id,
    text,
    title,
    media_url,
    media_type,
    post_type,
    tags,
    created_at,
    realm_id,

    actor:actor_presentation (
      actor_id,
      kind,
      display_name,
      username,
      photo_url,
      vport_name,
      vport_slug,
      vport_avatar_url,
      vport_banner_url
    )
  `)
  .eq("actor_id", actorId)
  .order("created_at", { ascending: false });


  if (error) throw error;
  return data ?? [];
}
