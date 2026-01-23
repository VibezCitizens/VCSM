import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BinaryReactionButton from "@/features/post/postcard/components/BinaryReactionButton";
import RoseReactionButton from "@/features/post/postcard/components/RoseReactionButton";
import CommentButton from "@/features/post/postcard/components/CommentButton";
import ShareReactionButton from "@/features/post/postcard/components/ShareReactionButton";

/**
 * ImageViewerModal
 * ------------------------------------------------------------
 * UI-only fullscreen image viewer.
 *
 * RULES:
 * - Receives fully-enriched posts
 * - Never derives meaning
 * - Never touches DAL / Supabase
 * - Delegates all actions via props
 */
export default function ImageViewerModal({
  imagePosts = [],
  activeIndex,
  setActiveIndex,
  onClose,

  // injected actions (domain-owned elsewhere)
  toggleReaction,
  sendRose,
  handleShare,
  openComments,
}) {
  const [localPosts, setLocalPosts] = useState(imagePosts);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // ----------------------------------------------------------
  // SYNC POSTS
  // ----------------------------------------------------------
  useEffect(() => {
    setLocalPosts(imagePosts);
  }, [imagePosts]);

  // ----------------------------------------------------------
  // LOCK BODY SCROLL
  // ----------------------------------------------------------
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // ----------------------------------------------------------
  // SCROLL TO ACTIVE IMAGE
  // ----------------------------------------------------------
  useEffect(() => {
    if (activeIndex != null && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({
        behavior: "auto",
        block: "center",
      });
    }
  }, [activeIndex]);

  // ----------------------------------------------------------
  // KEYBOARD CONTROLS
  // ----------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") {
        setActiveIndex?.((i) =>
          Math.min((i ?? 0) + 1, localPosts.length - 1)
        );
      }
      if (e.key === "ArrowLeft") {
        setActiveIndex?.((i) => Math.max((i ?? 0) - 1, 0));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, setActiveIndex, localPosts.length]);

  // ----------------------------------------------------------
  // UI EVENT DELEGATES
  // ----------------------------------------------------------
  const handleReaction = async (postId, type) => {
    await toggleReaction?.(postId, type);
  };

  const handleRose = async (postId) => {
    await sendRose?.(postId);
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* BACKDROP */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* SCROLL CONTAINER */}
      <div
        ref={containerRef}
        className="relative z-10 h-full w-full overflow-y-scroll snap-y snap-mandatory"
        onClick={(e) => e.stopPropagation()}
      >
        {localPosts.map((post, index) => (
          <div
            key={post.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className="snap-start h-full w-full flex items-center justify-center relative"
          >
            <img
              src={post.media_url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />

            {/* ACTION BAR */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-5 border border-white/10 flex flex-col gap-4 text-white text-xl">
              {/* 👍 LIKE */}
              <BinaryReactionButton
                type="like"
                emoji="👍"
                active={post.userHasReacted === "like"}
                count={post.likeCount || 0}
                onClick={() => handleReaction(post.id, "like")}
                disabled={false}
              />

              {/* 👎 DISLIKE */}
              <BinaryReactionButton
                type="dislike"
                emoji="👎"
                active={post.userHasReacted === "dislike"}
                count={post.dislikeCount || 0}
                onClick={() => handleReaction(post.id, "dislike")}
                disabled={false}
              />

              {/* 🌹 ROSE */}
              <RoseReactionButton
                count={post.roseCount || 0}
                onSend={() => handleRose(post.id)}
                disabled={false}
              />

              {/* 💬 COMMENTS */}
              <CommentButton
                count={post.commentCount || 0}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openComments?.(post.id);
                }}
              />

              {/* 🌍 SPREAD */}
<ShareReactionButton
  onClick={(e) => {
    e?.stopPropagation?.();
    handleShare?.(post.id);
  }}
  disabled={false}
/>

            </div>
          </div>
        ))}
      </div>

      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center text-white"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}
