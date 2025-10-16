// fire-and-forget event bus for unread badge deltas
const EVT = 'chat:unread-delta';

export function emitUnreadDelta(delta) {
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: { delta } })); } catch {}
}

export function onUnreadDelta(handler) {
  const fn = (e) => handler?.(e?.detail?.delta ?? 0);
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
