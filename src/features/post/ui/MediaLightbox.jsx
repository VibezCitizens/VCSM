// src/features/posts/ui/MediaLightbox.jsx
import { useEffect, useCallback } from 'react';
import useSwipeToClose from '@/features/post/lib/useSwipeToClose';

export default function MediaLightbox({ type, src, alt = '', onClose }) {
  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stop = useCallback((e) => e.stopPropagation(), []);

  // Swipe-down-to-close (mobile friendly)
  const { bind, contentStyle, backdropStyle } = useSwipeToClose({
    onClose,
    threshold: 90,   // tweak if you want it easier/harder
    maxPull: 180,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-sm"
      style={backdropStyle}
      // Click on the dark area closes; clicks on media won't
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* Safe-area top bar so the X isn't hidden by phone notches/status bar */}
      <div
        className="absolute left-0 right-0 flex items-center justify-end"
        style={{
          top: 0,
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingLeft: 'env(safe-area-inset-left)',
          height: 'calc(44px + env(safe-area-inset-top))',
        }}
        onClick={stop}
      >
        <button
          onClick={onClose}
          aria-label="Close viewer"
          className="mx-3 my-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
        >
          ✕
        </button>
      </div>

      {/* Swipeable content */}
      <div
        {...bind}
        onClick={stop}
        className="max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        style={contentStyle}
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
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
