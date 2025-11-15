import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export default function MessageActionsMenu({
  open,
  x,
  y,
  isOwn,
  onClose,
  onEdit,
  onDeleteForMe,
  onUnsend,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }} aria-hidden={!open}>
      <div
        ref={ref}
        className={clsx(
          'absolute min-w-[180px] rounded-2xl shadow-xl border border-white/10',
          'bg-black/80 text-white backdrop-blur-md',
          'pointer-events-auto select-none'
        )}
        style={{ left: x, top: y }}
      >
        <ul className="py-1 m-0 list-none pl-0 [&>li]:pl-0 [&>li::before]:content-none">
          {isOwn && (
            <li>
              <button
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white"
                onClick={() => { onUnsend?.(); onClose?.(); }}
              >
                Unsend
              </button>
            </li>
          )}
          <li>
            <button
              className="w-full text-left px-4 py-2 hover:bg-white/10 text-white"
              onClick={() => { onDeleteForMe?.(); onClose?.(); }}
            >
              Delete for me
            </button>
          </li>
          {isOwn && (
            <li>
              <button
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white"
                onClick={() => { onEdit?.(); onClose?.(); }}
              >
                Edit
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
