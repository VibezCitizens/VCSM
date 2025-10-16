// C:\Users\vibez\OneDrive\Desktop\no src\src\features\vport\vprofile\tabs\VportVideoFeed.jsx

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

/**
 * Basic, self-contained video grid for VPORT profiles.
 * - No external deps (no Supabase calls).
 * - Filters incoming `posts` for videos and shows a 3-column grid.
 * - Lightweight fullscreen viewer with Prev/Next + keyboard support.
 *
 * Props:
 *   - posts: Array of post objects that include { id, media_type, media_url, text, title }
 *   - className: optional container className override
 */
export default function VportVideoFeed({ posts = [], className = '' }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  const videoPosts = useMemo(() => {
    return (posts || []).filter((p) => {
      if (!p) return false;
      const url = (p.media_url || '').trim().toLowerCase();
      const isVideoType = p.media_type === 'video';
      const looksLikeVideo = url.endsWith('.mp4') || url.startsWith('blob:') || url.includes('/video/');
      return (isVideoType || looksLikeVideo) && url !== '';
    });
  }, [posts]);

  const openViewer = useCallback((index) => {
    setActiveIndex(index);
    setViewerOpen(true);
    setIsPlaying(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setActiveIndex(null);
    setIsPlaying(false);
  }, []);

  const goPrev = useCallback(() => {
    if (!videoPosts.length) return;
    setActiveIndex((prev) => (prev === 0 ? videoPosts.length - 1 : prev - 1));
    setIsPlaying(true);
  }, [videoPosts.length]);

  const goNext = useCallback(() => {
    if (!videoPosts.length) return;
    setActiveIndex((prev) => (prev === videoPosts.length - 1 ? 0 : prev + 1));
    setIsPlaying(true);
  }, [videoPosts.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  // When viewer state or activeIndex changes, play/pause accordingly
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // ensure we start from the beginning when switching videos
    el.currentTime = 0;

    const playPromise = isPlaying ? el.play() : el.pause();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay might be blocked; keep muted and try once.
        try {
          el.muted = true;
          el.play().catch(() => {});
        } catch {}
      });
    }
  }, [viewerOpen, activeIndex, isPlaying]);

  // Keyboard navigation inside viewer
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, closeViewer, goPrev, goNext, togglePlay]);

  if (!videoPosts.length) {
    return <p className="text-center text-neutral-500 py-10">No videos found.</p>;
  }

  return (
    <>
      <div className={`grid grid-cols-3 gap-2 p-2 ${className}`}>
        {videoPosts.map((post, idx) => (
          <button
            key={post.id ?? idx}
            type="button"
            className="aspect-square relative overflow-hidden rounded bg-black cursor-pointer hover:scale-[1.01] transition"
            onClick={() => openViewer(idx)}
            aria-label={`Open video ${idx + 1}`}
          >
            <video
              src={post.media_url}
              className="object-cover w-full h-full"
              muted
              loop
              playsInline
              preload="metadata"
            />
            {post.text && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                {post.text}
              </div>
            )}
          </button>
        ))}
      </div>

      {viewerOpen && activeIndex !== null && videoPosts[activeIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeViewer}
        >
          {/* Stop propagation so clicks on content don't close viewer */}
          <div className="relative max-w-5xl w-[92vw] h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <video
              ref={videoRef}
              src={videoPosts[activeIndex].media_url}
              className="w-full h-full object-contain"
              controls
              playsInline
              muted
              autoPlay
            />

            {(videoPosts[activeIndex].title || videoPosts[activeIndex].text) && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 text-white text-sm">
                {videoPosts[activeIndex].title || videoPosts[activeIndex].text}
              </div>
            )}

            {/* Controls */}
            <button
              type="button"
              onClick={closeViewer}
              className="absolute top-3 right-3 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 py-1"
              aria-label="Close"
              title="Close (Esc)"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/10 hover:bg-white/20 text-white px-3 py-2"
              aria-label="Previous video"
              title="Previous (←)"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 hover:bg-white/20 text-white px-3 py-2"
              aria-label="Next video"
              title="Next (→)"
            >
              ›
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="absolute top-3 left-3 rounded bg-white/10 hover:bg-white/20 text-white px-3 py-1"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title="Space to toggle"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            {/* Counter */}
            <div className="absolute top-3 left-24 text-white/80 text-xs">
              {activeIndex + 1} / {videoPosts.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
