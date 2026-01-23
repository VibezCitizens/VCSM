import { useMemo, useState, useCallback } from "react";

import ImageViewerModal from "./ImageViewerModal";
import CommentModal from "./CommentModal";
import { usePhotoReactions } from "../hooks/usePhotoReactions";
import { shareNative } from "@/shared/lib/shareNative";

/**
 * PhotoGrid
 * ------------------------------------------------------------
 * UI-only grid for displaying actor-owned image posts.
 *
 * RULES:
 * - Receives RAW posts only
 * - Filters for images locally (UI concern)
 * - Delegates ALL domain logic to hooks
 * - Never touches Supabase, DAL, or controllers
 */
export default function PhotoGrid({
  posts = [],
  actorId,
  handleShare,
}) {
  // ----------------------------------------------------------
  // FILTER → images only (UI responsibility)
  // ----------------------------------------------------------
  const imagePosts = useMemo(() => {
    return posts.filter(
      (p) =>
        !p?.deleted_at && // ✅ exclude soft-deleted
        p.media_type === "image" &&
        !!p.media_url
    );
  }, [posts]);

  // ----------------------------------------------------------
  // DOMAIN HOOK (actor-based)
  // ----------------------------------------------------------
  const { enriched, toggleReaction, sendRose } = usePhotoReactions(
    imagePosts,
    actorId
  );

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------
  const [activeIndex, setActiveIndex] = useState(null);
  const [activePostId, setActivePostId] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // ----------------------------------------------------------
  // SHARE FALLBACK (if parent didn't inject handleShare)
  // ----------------------------------------------------------
  const shareFallback = useCallback(async (postId) => {
    if (!postId) return;

    const url = `${window.location.origin}/post/${postId}`;

    // try native share (will no-op on unsupported environments)
    await shareNative({
      title: "Spread",
      text: "",
      url,
    });
  }, []);

  const shareFn = handleShare ?? shareFallback;

  // ----------------------------------------------------------
  // GUARDS (pure UI)
  // ----------------------------------------------------------
  if (!actorId) {
    return <div className="py-10 text-center text-neutral-500">Loading…</div>;
  }

  if (!imagePosts.length) {
    return (
      <div className="py-10 text-center text-neutral-500">
        No photos yet.
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <>
      {/* IMAGE GRID */}
      <div className="grid grid-cols-3 gap-1 p-2">
        {enriched.map((post, index) => (
          <img
            key={post.id}
            src={post.media_url}
            alt=""
            loading="lazy"
            className="aspect-square w-full object-cover cursor-pointer"
            onClick={() => {
              setActiveIndex(index);
              setActivePostId(post.id);
              setShowViewer(true);
            }}
          />
        ))}
      </div>

      {/* IMAGE VIEWER */}
      {showViewer && (
        <ImageViewerModal
          imagePosts={enriched}
          activeIndex={activeIndex}
          activePostId={activePostId}
          setActiveIndex={setActiveIndex}
          onClose={() => setShowViewer(false)}
          toggleReaction={toggleReaction}
          sendRose={sendRose}
          handleShare={shareFn}
          openComments={(postId) => {
            setSelectedPostId(postId);
            setShowComments(true);
          }}
        />
      )}

      {/* COMMENTS */}
      {showComments && (
        <CommentModal
          postId={selectedPostId}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  );
}
