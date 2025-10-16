// src/features/posts/ui/PostMenu.jsx
/**
 * Kebab menu for post actions (delete/report). Manages its own open/close.
 */
import { memo, useEffect, useRef, useState } from 'react';

function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

function PostMenu({ canDelete = false, onDelete = () => {}, onReport = () => {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((p) => !p)} aria-label="Post menu">⋯</button>
      {open && (
        <div
          className="
            absolute right-0 top-full mt-2
            rounded-2xl px-2 py-2
            bg-black/80 backdrop-blur
            shadow-[0_12px_30px_rgba(0,0,0,0.45)]
            border border-white/10
            ring-1 ring-white/5
            z-50
          "
        >
          {canDelete ? (
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="
                w-full text-left
                px-4 py-2
                rounded-xl
                text-rose-300/90
                hover:bg-white/5
                active:(scale-98 bg-white/10)
                transition-all duration-150
              "
            >
              Delete Post
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); onReport(); }}
              className="
                w-full text-left
                px-4 py-2
                rounded-xl
                bg-white text-black
                shadow-[0_6px_16px_rgba(0,0,0,0.25)]
                border border-black/10
                hover:(translate-y--0.5px shadow-[0_8px_18px_rgba(0,0,0,0.30)])
                active:(translate-y-0 shadow-[0_4px_10px_rgba(0,0,0,0.22)] scale-99)
                transition-transform transition-shadow duration-150
              "
            >
              Report Post
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(PostMenu);
