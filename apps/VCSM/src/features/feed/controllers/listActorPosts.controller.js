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

import { listActorPostsByActorDAL } from "@/features/feed/dal/listActorPostsByActor.dal";

export async function listActorPosts({ actorId, viewerActorId }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  return listActorPostsByActorDAL({ actorId });
}
