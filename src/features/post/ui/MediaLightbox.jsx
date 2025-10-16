// src/features/posts/ui/MediaLightbox.jsx
import { useEffect, useCallback } from 'react';

export default function MediaLightbox({ type, src, alt = '', onClose }) {
  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stop = useCallback((e) => e.stopPropagation(), []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-3 right-3">
        <button
          onClick={onClose}
          aria-label="Close viewer"
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div
        className="max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        onClick={stop}
      >
        {type === 'video' ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
            loading="eager"
          />
        )}
      </div>
    </div>
  );
}
