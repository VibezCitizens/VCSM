import { useMemo, useState, useCallback, useEffect } from "react";
import { Images, MessageCircle, Play, ThumbsUp } from "lucide-react";

import ImageViewerModal from "./ImageViewerModal";
import CommentModal from "./CommentModal";
import { usePhotoReactions } from "../hooks/usePhotoReactions";
import { shareNative } from "@/shared/lib/shareNative";
import "@/features/profiles/styles/profiles-photos-modern.css";

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
        // Prefer normalized multi-media: post.media = [{ type, url }, ...]
        const mediaArr = Array.isArray(p?.media) ? p.media.filter(Boolean) : [];

        const imagesFromMedia = mediaArr
          .filter((m) => (m?.type || m?.media_type) === "image" && !!(m?.url || m?.media_url))
          .map((m) => ({
            url: m.url || m.media_url,
            type: "image",
          }));

        // Legacy fallback: posts.media_url + posts.media_type
        const legacyIsImage = p?.media_type === "image" && !!p?.media_url;
        const legacy = legacyIsImage ? [{ url: p.media_url, type: "image" }] : [];

        const images = imagesFromMedia.length ? imagesFromMedia : legacy;
        const mediaCount = mediaArr.length || images.length;
        const hasVideo =
          mediaArr.some((m) => (m?.type || m?.media_type) === "video") ||
          p?.media_type === "video";

        return {
          ...p,
          images,
          mediaCount,
          hasVideo,
        };
      })
      .filter((p) => Array.isArray(p.images) && p.images.length > 0);
  }, [posts]);

  // ----------------------------------------------------------
  // DOMAIN HOOK (actor-based)
  // ----------------------------------------------------------
  const { enriched, toggleReaction, sendRose } = usePhotoReactions(imagePosts, actorId);

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------
  const [activePostIndex, setActivePostIndex] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activePostId, setActivePostId] = useState(null);

  const [showViewer, setShowViewer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [viewerOrigin, setViewerOrigin] = useState("grid");

  const featuredPost = enriched[0] ?? null;
  const gridPosts = enriched.slice(1);

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

  const openViewerForPost = (postIndex, origin = "grid") => {
    const target = enriched[postIndex];
    if (!target) return;

    setViewerOrigin(origin);
    setActivePostIndex(postIndex);
    setActiveImageIndex(0);
    setActivePostId(target.id);
    setShowViewer(true);
  };

  // ----------------------------------------------------------
  // GUARDS (pure UI)
  // ----------------------------------------------------------
  if (!actorId) {
    return <div className="py-10 text-center text-neutral-500">Loading...</div>;
  }

  if (!enriched.length) {
    return <div className="py-10 text-center text-neutral-500">No photos yet.</div>;
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <>
      {featuredPost && (
        <button
          type="button"
          className="profiles-photo-featured-card"
          onClick={() => openViewerForPost(0, "featured")}
        >
          <MediaThumb
            src={featuredPost.images?.[0]?.url}
            alt=""
            className="profiles-photo-featured-media"
          />

          <div className="profiles-photo-featured-overlay">
            <div className="profiles-photo-featured-label">Latest Post</div>
            <div className="profiles-photo-featured-meta">
              <StatPill icon={ThumbsUp} value={featuredPost.likeCount || 0} />
              <StatPill icon={MessageCircle} value={featuredPost.commentCount || 0} />
            </div>
          </div>
        </button>
      )}

      <div className="profiles-photo-grid">
        {gridPosts.map((post, gridIndex) => {
          const source = post.images?.[0]?.url;
          const postIdx = gridIndex + 1;
          const mediaCount = post.mediaCount || post.images?.length || 1;

          return (
            <button
              key={post.id}
              type="button"
              className="profiles-photo-tile"
              onClick={() => openViewerForPost(postIdx, "grid")}
            >
              <MediaThumb src={source} alt="" className="profiles-photo-tile-media" />

              <div className="profiles-photo-tile-overlay" />

              <div className="profiles-photo-tile-badges">
                {post.hasVideo && (
                  <span className="profiles-photo-tile-badge" title="Contains video">
                    <Play size={12} />
                  </span>
                )}
                {mediaCount > 1 && (
                  <span className="profiles-photo-tile-badge" title="Album">
                    <Images size={12} />
                    <span>{mediaCount}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showViewer && activePostIndex != null && (
        <ImageViewerModal
          imagePosts={enriched[activePostIndex]?.images || []}
          activePost={enriched[activePostIndex] || null}
          activeIndex={activeImageIndex}
          activePostId={activePostId}
          viewerOrigin={viewerOrigin}
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

      {showComments && (
        <CommentModal postId={selectedPostId} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}

function StatPill({ icon: Icon, value }) {
  return (
    <div className="profiles-photo-stat-pill">
      <Icon size={12} />
      <span>{value}</span>
    </div>
  );
}

function MediaThumb({ src, alt, className = "" }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className={`profiles-photo-media ${className}`}>
      <div className={`profiles-photo-media-skeleton ${loaded ? "is-hidden" : ""}`} />

      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`profiles-photo-media-img ${loaded ? "is-loaded" : ""}`}
        />
      ) : (
        <div className="profiles-photo-media-fallback">Media unavailable</div>
      )}
    </div>
  );
}

