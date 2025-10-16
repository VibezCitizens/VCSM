// C:\Users\vibez\OneDrive\Desktop\no src\src\features\vport\vprofile\tabs\VportPhotoGrid.jsx

import { useMemo, useState, useCallback, useEffect } from 'react';

/**
 * Basic, self-contained photo grid for VPORT profiles.
 * - No external deps (no Supabase calls, no reaction/comment modals).
 * - Filters incoming `posts` for images and shows a 3-column grid.
 * - Lightweight built-in fullscreen viewer with Prev/Next + keyboard support.
 *
 * Props:
 *   - posts: Array of post objects that include { id, media_type, media_url, text, title }
 *   - className: optional container className override
 */
export default function VportPhotoGrid({ posts = [], className = '' }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  // Only keep posts that are valid images
  const imagePosts = useMemo(() => {
    return (posts || []).filter(
      (p) => p && p.media_type === 'image' && typeof p.media_url === 'string' && p.media_url.trim() !== ''
    );
  }, [posts]);

  const openViewer = useCallback((index) => {
    setActiveIndex(index);
    setViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setActiveIndex(null);
  }, []);

  const goPrev = useCallback(() => {
    if (!imagePosts.length) return;
    setActiveIndex((prev) => (prev === 0 ? imagePosts.length - 1 : prev - 1));
  }, [imagePosts.length]);

  const goNext = useCallback(() => {
    if (!imagePosts.length) return;
    setActiveIndex((prev) => (prev === imagePosts.length - 1 ? 0 : prev + 1));
  }, [imagePosts.length]);

  // Keyboard navigation when viewer is open
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, closeViewer, goPrev, goNext]);

  if (!imagePosts.length) {
    return <div className="text-center text-neutral-400 py-10">No images yet.</div>;
  }

  return (
    <>
      <div className={`grid grid-cols-3 gap-1 p-2 ${className}`}>
        {imagePosts.map((post, idx) => (
          <button
            key={post.id ?? idx}
            type="button"
            className="w-full aspect-square overflow-hidden"
            onClick={() => openViewer(idx)}
            aria-label={`Open image ${idx + 1}`}
          >
            <img
              src={post.media_url}
              alt={post.title || post.text || 'Image'}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      {viewerOpen && activeIndex !== null && imagePosts[activeIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeViewer}
        >
          {/* Stop propagation so clicks on content don't close viewer */}
          <div className="relative max-w-5xl w-[92vw] h-[92vh]" onClick={(e) => e.stopPropagation()}>
            {/* Image */}
            <img
              src={imagePosts[activeIndex].media_url}
              alt={imagePosts[activeIndex].title || imagePosts[activeIndex].text || 'Image'}
              className="w-full h-full object-contain"
              draggable="false"
            />

            {/* Caption (optional) */}
            {(imagePosts[activeIndex].title || imagePosts[activeIndex].text) && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 text-white text-sm">
                {imagePosts[activeIndex].title || imagePosts[activeIndex].text}
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
              aria-label="Previous image"
              title="Previous (←)"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 hover:bg-white/20 text-white px-3 py-2"
              aria-label="Next image"
              title="Next (→)"
            >
              ›
            </button>

            {/* Counter */}
            <div className="absolute top-3 left-3 text-white/80 text-xs">
              {activeIndex + 1} / {imagePosts.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
