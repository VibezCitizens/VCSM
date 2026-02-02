import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BinaryReactionButton from "@/features/post/postcard/components/BinaryReactionButton";
import RoseReactionButton from "@/features/post/postcard/components/RoseReactionButton";
import CommentButton from "@/features/post/postcard/components/CommentButton";
import ShareReactionButton from "@/features/post/postcard/components/ShareReactionButton";

export default function ImageViewerModal({
  imagePosts = [],
  activePost = null,
  activePostId,
  activeIndex,
  setActiveIndex,
  onClose,
  toggleReaction,
  sendRose,
  handleShare,
  openComments,
}) {
  const [localImages, setLocalImages] = useState(imagePosts);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    setLocalImages(imagePosts);
  }, [imagePosts]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (activeIndex != null && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({
        behavior: "auto",
        block: "center",
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") {
        setActiveIndex?.((i) => Math.min((i ?? 0) + 1, localImages.length - 1));
      }
      if (e.key === "ArrowLeft") {
        setActiveIndex?.((i) => Math.max((i ?? 0) - 1, 0));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, setActiveIndex, localImages.length]);

  const handleReaction = async (postId, type) => {
    if (!postId) return;
    await toggleReaction?.(postId, type);
  };

  const handleRose = async (postId) => {
    if (!postId) return;
    await sendRose?.(postId);
  };

  const canAct = !!activePostId;

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
        {localImages.map((img, index) => {
          const src =
            img?.url || img?.media_url || img?.media?.url || img?.media?.media_url;

          return (
            <div
              key={img?.id ? `${img.id}-${index}` : `${src || "img"}-${index}`}
              ref={(el) => (itemRefs.current[index] = el)}
              className="snap-start h-full w-full flex items-center justify-center relative"
            >
              {src ? (
                <img
                  src={src}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="text-white/70 text-sm">Image unavailable</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ SINGLE ACTION BAR (always reflects activePost) */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-5 border border-white/10 flex flex-col gap-4 text-white text-xl">
        <BinaryReactionButton
          type="like"
          emoji="👍"
          active={activePost?.userHasReacted === "like"}
          count={activePost?.likeCount || 0}
          onClick={() => handleReaction(activePostId, "like")}
          disabled={!canAct}
        />

        <BinaryReactionButton
          type="dislike"
          emoji="👎"
          active={activePost?.userHasReacted === "dislike"}
          count={activePost?.dislikeCount || 0}
          onClick={() => handleReaction(activePostId, "dislike")}
          disabled={!canAct}
        />

        <RoseReactionButton
          count={activePost?.roseCount || 0}
          onSend={() => handleRose(activePostId)}
          disabled={!canAct}
        />

        <CommentButton
          count={activePost?.commentCount || 0}
          onClick={(e) => {
            e?.stopPropagation?.();
            if (!canAct) return;
            openComments?.(activePostId);
          }}
        />

        <ShareReactionButton
          onClick={(e) => {
            e?.stopPropagation?.();
            if (!canAct) return;
            handleShare?.(activePostId);
          }}
          disabled={!canAct}
        />
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
