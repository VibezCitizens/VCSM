/**
 * ============================================================
 * ActorProfilePhotosView
 * ------------------------------------------------------------
 * Profile → Photos domain view (ACTOR-BASED)
 *
 * View Screen rules:
 * - Composes hooks + UI only
 * - No DAL / Supabase
 * - No controllers
 * - No business meaning
 * ============================================================
 */

import PhotoGrid from "./tabs/photos/components/PhotoGrid";

/**
 * @param {Object} props
 * @param {string}  props.actorId            Target profile actor
 * @param {Array}   props.posts              Aggregated post rows (raw)
 * @param {boolean} props.loadingPosts       Loading state from parent
 * @param {boolean} props.canViewContent     Privacy gate (resolved upstream)
 * @param {Function} props.handleShare       Optional share handler
 */
export default function ActorProfilePhotosView({
  actorId,
  posts = [],
  loadingPosts,
  canViewContent,
  handleShare,
}) {
  /* ==========================================================
     DEBUG — ENTRY SNAPSHOT
     ========================================================== */
  console.group("[ActorProfilePhotosView]");
  console.log("actorId:", actorId);
  console.log("loadingPosts:", loadingPosts);
  console.log("canViewContent:", canViewContent);
  console.log("posts.length:", posts?.length);
  console.log("posts sample:", posts?.slice?.(0, 3));
  console.groupEnd();

  // ----------------------------------------------------------
  // HARD GATES (VIEW-LEVEL ONLY)
  // ----------------------------------------------------------
  if (loadingPosts) {
    console.warn("[ActorProfilePhotosView] blocked: loadingPosts");
    return (
      <div className="flex items-center justify-center py-10 text-neutral-400">
        Loading photos…
      </div>
    );
  }

  if (!canViewContent) {
    console.warn("[ActorProfilePhotosView] blocked: private content");
    return (
      <div className="flex items-center justify-center py-10 text-neutral-500">
        This content is private.
      </div>
    );
  }

  if (!actorId) {
    console.error("[ActorProfilePhotosView] blocked: missing actorId");
    return (
      <div className="flex items-center justify-center py-10 text-neutral-500">
        Profile unavailable.
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  console.log("[ActorProfilePhotosView] rendering PhotoGrid");

  return (
    <PhotoGrid
      posts={posts}
      actorId={actorId}
      handleShare={handleShare}
    />
  );
}
