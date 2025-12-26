import { X, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    if (
      activeIndex != null &&
      itemRefs.current[activeIndex]
    ) {
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
        setActiveIndex?.((i) =>
          Math.max((i ?? 0) - 1, 0)
        );
      }
    };

    window.addEventListener("keydown", onKey);
    return () =>
      window.removeEventListener("keydown", onKey);
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
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* SCROLL CONTAINER */}
      <div
        ref={containerRef}
        className="relative z-10 h-full w-full overflow-y-scroll snap-y snap-mandatory"
        onClick={(e) => e.stopPropagation()}
      >
        {localPosts.map((post, index) => (
          <div
            key={post.id}
            ref={(el) =>
              (itemRefs.current[index] = el)
            }
            className="snap-start h-full w-full flex items-center justify-center relative"
          >
            <img
              src={post.media_url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />

            {/* ACTION BAR */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-5 border border-white/10 flex flex-col gap-4 text-white text-xl">
              <button
                onClick={() =>
                  handleReaction(post.id, "like")
                }
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`text-2xl ${
                    post.userHasReacted === "like"
                      ? "text-blue-400"
                      : ""
                  }`}
                >
                  👍
                </div>
                <span className="text-xs">
                  {post.likeCount || 0}
                </span>
              </button>

              <button
                onClick={() =>
                  handleReaction(post.id, "dislike")
                }
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`text-2xl ${
                    post.userHasReacted === "dislike"
                      ? "text-red-400"
                      : ""
                  }`}
                >
                  👎
                </div>
                <span className="text-xs">
                  {post.dislikeCount || 0}
                </span>
              </button>

              <button
                onClick={() => handleRose(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="text-2xl">🌹</div>
                <span className="text-xs">
                  {post.roseCount || 0}
                </span>
              </button>

              <button
                onClick={() =>
                  openComments?.(post.id)
                }
                className="flex flex-col items-center gap-1"
              >
                <div className="text-2xl">💬</div>
                <span className="text-xs">
                  {post.commentCount || 0}
                </span>
              </button>

              <button
                onClick={() =>
                  handleShare?.(post)
                }
                title="Share"
                className="flex items-center justify-center"
              >
                <Share2 className="w-5 h-5" />
              </button>
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
