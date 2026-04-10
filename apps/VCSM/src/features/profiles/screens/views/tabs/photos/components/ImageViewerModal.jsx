import { X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import BinaryReactionButton from "@/features/post/adapters/postcard/components/BinaryReactionButton.adapter";
import RoseReactionButton from "@/features/post/adapters/postcard/components/RoseReactionButton.adapter";
import CommentButton from "@/features/post/adapters/postcard/components/CommentButton.adapter";
import ShareReactionButton from "@/features/post/adapters/postcard/components/ShareReactionButton.adapter";

export default function ImageViewerModal({
  imagePosts = [],
  activePost = null,
  activePostId,
  activeIndex,
  viewerOrigin = "grid",
  setActiveIndex,
  onClose,
  toggleReaction,
  sendRose,
  handleShare,
  openComments,
}) {
  const [localImages, setLocalImages] = useState(imagePosts);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    setLocalImages(imagePosts);
  }, [imagePosts]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const requestClose = useCallback(() => {
    setIsOpen(false);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 190);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Freeze background scroll (iOS Safari safe)
  useEffect(() => {
    const scrollY = window.scrollY || 0;
    const body = document.body;

    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
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
      if (e.key === "Escape") requestClose();
      if (e.key === "ArrowRight") {
        setActiveIndex?.((i) => Math.min((i ?? 0) + 1, localImages.length - 1));
      }
      if (e.key === "ArrowLeft") {
        setActiveIndex?.((i) => Math.max((i ?? 0) - 1, 0));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, setActiveIndex, localImages.length]);

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
    <div
      className={`profiles-photo-viewer fixed inset-0 z-[70] ${isOpen ? "is-open" : ""} ${
        viewerOrigin === "featured" ? "from-featured" : "from-grid"
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop — tapping closes */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.92)' }}
        onClick={requestClose}
      />

      {/* Close button — ABOVE everything, own layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 100 }}
      >
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestClose(); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); requestClose(); }}
          className="pointer-events-auto absolute flex items-center justify-center rounded-full text-white"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 14px)",
            right: "calc(env(safe-area-inset-right, 0px) + 14px)",
            width: 44,
            height: 44,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="relative h-full w-full flex items-center justify-center"
        style={{ zIndex: 10 }}
      >
        {localImages.length === 1 ? (
          // Single image — no scroll, just centered
          <div
            className="h-full w-full flex items-center justify-center p-4"
            onClick={requestClose}
          >
            {localImages[0]?.url ? (
              <img
                src={localImages[0].url}
                alt=""
                className="max-h-full max-w-full object-contain"
                draggable={false}
                onClick={(e) => e.stopPropagation()}
                style={{ borderRadius: 4 }}
              />
            ) : (
              <div className="text-white/50 text-sm">Image unavailable</div>
            )}
          </div>
        ) : (
          // Multiple images — vertical snap scroll
          <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory">
            {localImages.map((img, index) => {
              const src =
                img?.url || img?.media_url || img?.media?.url || img?.media?.media_url;

              return (
                <div
                  key={img?.id ? `${img.id}-${index}` : `${src || "img"}-${index}`}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className="snap-start h-full w-full flex items-center justify-center p-4"
                  onClick={requestClose}
                >
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderRadius: 4 }}
                    />
                  ) : (
                    <div className="text-white/50 text-sm">Image unavailable</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reaction sidebar — only for posts (Photos tab), hidden for portfolio */}
      {canAct && (
        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-3 rounded-2xl px-3 py-4 text-white"
          style={{
            right: "calc(env(safe-area-inset-right, 0px) + 8px)",
            zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: 'auto',
          }}
        >
          <BinaryReactionButton
            type="like"
            emoji={"\uD83D\uDC4D"}
            active={activePost?.userHasReacted === "like"}
            count={activePost?.likeCount || 0}
            onClick={() => handleReaction(activePostId, "like")}
            disabled={!canAct}
          />

          <BinaryReactionButton
            type="dislike"
            emoji={"\uD83D\uDC4E"}
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
      )}
    </div>
  );
}
