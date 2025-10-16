// src/features/profiles/components/ProfileDots.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { blockUser, unblockUser } from '@/data/user/blocks/blocks';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ProfileDots({
  targetId,
  initialBlocked = false,
  onBlock,                 // (nowBlocked: boolean) => void
  redirectOnBlock = true,  // redirect after blocking (default true)
  extraMenu = null,        // NEW: optional ReactNode to inject custom menu items
}) {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // keep in sync if parent changes
  useEffect(() => setIsBlocked(!!initialBlocked), [initialBlocked]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // close on escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // NEW: close menu on route change
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const canAct = user?.id && targetId && user.id !== targetId;

  const doBlock = async () => {
    if (!canAct || busy) return;
    setBusy(true);
    try {
      await blockUser(targetId);
      setIsBlocked(true);
      onBlock?.(true);
      toast.success('User blocked');

      if (redirectOnBlock) {
        nav('/', { replace: true, state: { justBlocked: targetId } });
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to block');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const doUnblock = async () => {
    if (!canAct || busy) return;
    setBusy(true);
    try {
      await unblockUser(targetId);
      setIsBlocked(false);
      onBlock?.(false);
      toast.success('User unblocked');
    } catch (e) {
      toast.error(e?.message || 'Failed to unblock');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative z-50">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        onClick={() => setOpen(v => !v)}
        className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        {/* vertical ellipsis */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
          fill="currentColor" className="w-5 h-5 text-white">
          <path d="M10 3.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-lg p-1 z-50"
        >
          {/* NEW: custom items slot (e.g., "Request Follow") */}
          {extraMenu}

          {/* If you want a subtle divider when extraMenu exists */}
          {extraMenu && <div className="my-1 h-px bg-white/10" />}

          {isBlocked ? (
            <button
              type="button"
              role="menuitem"
              disabled={!canAct || busy}
              onClick={doUnblock}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-200 hover:bg-white/10 disabled:opacity-50"
            >
              Unblock
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled={!canAct || busy}
              onClick={doBlock}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-white/10 disabled:opacity-50"
            >
              Block
            </button>
          )}
        </div>
      )}
    </div>
  );
}
