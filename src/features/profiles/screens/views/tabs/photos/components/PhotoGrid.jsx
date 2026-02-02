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
export default function PhotoGrid({ posts = [], actorId, handleShare }) {
  // ----------------------------------------------------------
  // Normalize images per post (supports multi-media + legacy)
  // ----------------------------------------------------------
  const imagePosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];

    return list
      .filter((p) => !p?.deleted_at)
      .map((p) => {
        // ✅ Prefer normalized multi-media: post.media = [{ type, url }, ...]
        const mediaArr = Array.isArray(p?.media) ? p.media.filter(Boolean) : [];

        const imagesFromMedia = mediaArr
          .filter((m) => (m?.type || m?.media_type) === "image" && !!(m?.url || m?.media_url))
          .map((m) => ({
            url: m.url || m.media_url,
            type: "image",
          }));

        // ✅ Legacy fallback: posts.media_url + posts.media_type
        const legacyIsImage = p?.media_type === "image" && !!p?.media_url;
        const legacy = legacyIsImage ? [{ url: p.media_url, type: "image" }] : [];

        const images = imagesFromMedia.length ? imagesFromMedia : legacy;

        return {
          ...p,
          images, // ✅ SSOT for PhotoGrid
        };
      })
      .filter((p) => Array.isArray(p.images) && p.images.length > 0);
  }, [posts]);

  // ----------------------------------------------------------
  // DOMAIN HOOK (actor-based)
  // NOTE: keep your existing hook input shape (posts list)
  // ----------------------------------------------------------
  const { enriched, toggleReaction, sendRose } = usePhotoReactions(imagePosts, actorId);

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------
  const [activePostIndex, setActivePostIndex] = useState(null); // which post in enriched[]
  const [activeImageIndex, setActiveImageIndex] = useState(0);  // which image within post.images[]
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

  if (!enriched.length) {
    return <div className="py-10 text-center text-neutral-500">No photos yet.</div>;
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <>
      {/* IMAGE GRID */}
      <div className="grid grid-cols-3 gap-1 p-2">
        {enriched.map((post, postIdx) => {
          const imgs = Array.isArray(post.images) ? post.images : [];
          const first = imgs[0]?.url;

          // up to 4 thumbnails
          const thumbs = imgs.slice(0, 4);

          return (
            <button
              key={post.id}
              type="button"
              className="relative aspect-square w-full overflow-hidden"
              onClick={() => {
                setActivePostIndex(postIdx);
                setActiveImageIndex(0);
                setActivePostId(post.id);
                setShowViewer(true);
              }}
            >
              {/* 1 image -> simple */}
              {thumbs.length <= 1 ? (
                <img
                  src={first}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                // 2-4 images -> 2x2 collage
                <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
                  {thumbs.map((t, i) => (
                    <img
                      key={`${post.id}-t-${i}`}
                      src={t.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ))}
                  {/* fill empty cells if only 2 or 3 */}
                  {thumbs.length === 2 && (
                    <>
                      <div className="bg-neutral-900" />
                      <div className="bg-neutral-900" />
                    </>
                  )}
                  {thumbs.length === 3 && <div className="bg-neutral-900" />}
                </div>
              )}

              {/* badge: total count */}
              {imgs.length > 1 && (
                <div className="absolute top-1 right-1 rounded-full bg-black/70 text-white text-[11px] px-2 py-0.5">
                  {imgs.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* IMAGE VIEWER */}
     {showViewer && activePostIndex != null && (
  <ImageViewerModal
    imagePosts={enriched[activePostIndex]?.images || []}
    activePost={enriched[activePostIndex] || null}
    activeIndex={activeImageIndex}
    activePostId={activePostId}
    setActiveIndex={setActiveImageIndex}
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
        <CommentModal postId={selectedPostId} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}
