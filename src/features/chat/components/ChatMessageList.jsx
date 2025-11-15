import React, {
  useEffect, useLayoutEffect, useMemo, useRef, useCallback, useState,
} from 'react';
import ChatMessage from './ChatMessage';
import MessageActionsMenu from './MessageActionsMenu';

const NEAR_BOTTOM_PX = 64;
const LONG_PRESS_MS = 350;

const isUuid = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const isTempMessage = (m) =>
  !!m && (m._optimistic === true || (typeof m.id === 'string' && !isUuid(m.id)));

function getPoint(e) {
  if (e && typeof e === 'object' && 'touches' in e) {
    const t = e.touches && e.touches[0];
    if (t) return { x: t.clientX, y: t.clientY };
  }
  const ev = e?.nativeEvent ?? e;
  return { x: ev?.clientX ?? 0, y: ev?.clientY ?? 0 };
}

export default function ChatMessageList({
  messages,
  currentUserId,
  selfActorId,
  onDeleteForMe,
  onUnsend,
  onEdit,               // (id) => void — parent opens edit-in-input
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  onLoadOlder,
  hasMore = false,
  loadingOlder = false,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const msgLen = Array.isArray(messages) ? messages.length : 0;
  const prevLenRef = useRef(msgLen);

  // actions popover
  const [menu, setMenu] = useState(null); // { id, x, y, isOwn }

  // top sentinel
  const topSentinelRef = useRef(null);

  // prepend tracking
  const firstIdRef = useRef(messages?.[0]?.id ?? null);
  const beforePrependHeightRef = useRef(0);
  const expectPrependRef = useRef(false);

  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const newest = msgLen ? messages[msgLen - 1] : null;

  const isOwnByActor = useCallback(
    (msg) => {
      if (selfActorId && msg?.sender_actor_id === selfActorId) return true;
      if (currentUserId && (msg?.sender_user_id === currentUserId || msg?.sender_id === currentUserId)) return true;
      if (selfActorId && msg?.sender_vport_id === selfActorId) return true;
      return false;
    },
    [currentUserId, selfActorId]
  );

  const newestFromMe = !!newest && isOwnByActor(newest);

  const scrollToBottom = useCallback(
    (behavior = 'smooth') => {
      const el = containerRef.current;
      if (!el) return;
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : behavior });
      } catch {
        el.scrollTop = el.scrollHeight;
      }
    },
    [reduceMotion]
  );

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distance <= NEAR_BOTTOM_PX;
  }, []);

  useLayoutEffect(() => { scrollToBottom('auto'); }, [scrollToBottom]);

  useEffect(() => {
    const len = msgLen;
    const prevLen = prevLenRef.current;
    if (len === prevLen) return;

    const firstNow = messages?.[0]?.id ?? null;
    if (expectPrependRef.current && firstNow !== firstIdRef.current) {
      prevLenRef.current = len;
      return;
    }

    if (isAtBottomRef.current || newestFromMe) {
      const behavior = len - prevLen > 3 ? 'auto' : 'smooth';
      scrollToBottom(behavior);
    }
    prevLenRef.current = len;
  }, [msgLen, newestFromMe, scrollToBottom, messages]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const onLoad = (e) => {
      if (!root.contains(e.target)) return;
      if (isAtBottomRef.current) scrollToBottom('auto');
    };
    root.addEventListener('load', onLoad, true);
    root.addEventListener('resize', onLoad, true);
    return () => {
      root.removeEventListener('load', onLoad, true);
      root.removeEventListener('resize', onLoad, true);
    };
  }, [scrollToBottom]);

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    const onDocClick = (e) => {
      const root = containerRef.current;
      if (!root) return closeMenu();
      if (!root.contains(e.target)) closeMenu();
    };
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (loadingOlder) {
      beforePrependHeightRef.current = el.scrollHeight;
      firstIdRef.current = messages?.[0]?.id ?? null;
      expectPrependRef.current = true;
    }
  }, [loadingOlder, messages]);

  useLayoutEffect(() => {
    if (!expectPrependRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const currentFirst = messages?.[0]?.id ?? null;
    if (currentFirst !== firstIdRef.current) {
      const after = el.scrollHeight;
      const before = beforePrependHeightRef.current || 0;
      const delta = after - before;
      el.scrollTop += delta;
      expectPrependRef.current = false;
      beforePrependHeightRef.current = 0;
      firstIdRef.current = currentFirst;
    }
  }, [messages]);

  useEffect(() => {
    if (!onLoadOlder || !hasMore) return;
    const el = topSentinelRef.current;
    const root = containerRef.current;
    if (!el || !root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && !loadingOlder) onLoadOlder();
      },
      { root, rootMargin: '200px 0px 0px 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadOlder, hasMore, loadingOlder]);

  const handleManualTopLoad = useCallback(() => {
    if (!onLoadOlder || !hasMore || loadingOlder) return;
    onLoadOlder();
  }, [onLoadOlder, hasMore, loadingOlder]);

  const startLongPress = useCallback(
    (e, msg, isOwn) => {
      if (selectionMode) { onToggleSelect?.(msg.id); return; }
      if (isTempMessage(msg)) return;

      const target = e.currentTarget;
      const press = { cancelled: false, timer: null };
      const end = () => { press.cancelled = true; clearTimeout(press.timer); };

      target.addEventListener('mouseleave', end, { once: true });
      target.addEventListener('mouseup', end, { once: true });
      target.addEventListener('touchend', end, { once: true });
      target.addEventListener('touchmove', end, { once: true });

      const { x, y } = getPoint(e);

      press.timer = setTimeout(() => {
        if (press.cancelled) return;
        setMenu({ id: msg.id, x, y, isOwn: !!isOwn });
      }, LONG_PRESS_MS);
    },
    [selectionMode, onToggleSelect]
  );

  const handleMenuAction = useCallback(
    (action) => {
      if (!menu?.id) return;
      const id = menu.id;
      setMenu(null);
      if (action === 'unsend') onUnsend?.(id);
      if (action === 'deleteForMe') onDeleteForMe?.(id);
      if (action === 'edit') onEdit?.(id); // parent will open edit-in-input
    },
    [menu, onUnsend, onDeleteForMe, onEdit]
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onContextMenu={(e) => e.preventDefault()}
      className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-4 bg-black"
    >
      <div ref={topSentinelRef} />

      {hasMore && (
        <div className="py-2 text-center text-white/50">
          {loadingOlder ? (
            <span>Loading…</span>
          ) : (
            <button
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
              onClick={handleManualTopLoad}
              type="button"
            >
              Load older
            </button>
          )}
        </div>
      )}

      {(messages ?? []).map((msg, idx) => {
        const isOwn = isOwnByActor(msg);
        const isSelected = selectedIds?.has?.(msg.id);
        const disabled = isTempMessage(msg);
        return (
          <div
            key={msg.id || msg.uuid || idx}
            className="mb-2 px-1"
            onMouseDown={(e) => !disabled && startLongPress(e, msg, isOwn)}
            onTouchStart={(e) => !disabled && startLongPress(e, msg, isOwn)}
          >
            <div
              className={[
                'max-w-[78%]',
                'break-words',
                '[overflow-wrap:anywhere]',
                isOwn ? 'ml-auto' : '',
              ].join(' ')}
            >
              <ChatMessage
                message={msg}
                isOwn={isOwn}
                selectionMode={selectionMode}
                selected={!!isSelected}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(msg.id) : undefined}
                disabledActions={disabled}
              />
            </div>
          </div>
        );
      })}

      <MessageActionsMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        isOwn={menu?.isOwn ?? false}
        onClose={() => setMenu(null)}
        onUnsend={() => handleMenuAction('unsend')}
        onDeleteForMe={() => handleMenuAction('deleteForMe')}
        onEdit={() => handleMenuAction('edit')}
      />

      <div ref={bottomRef} />
    </div>
  );
}
