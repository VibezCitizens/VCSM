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
        <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded shadow p-2 z-50">
          {canDelete ? (
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="text-red-400"
            >
              Delete Post
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); onReport(); }}
              className="text-yellow-400"
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
