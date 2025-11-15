// src/features/chat/components/ConversationPreview.jsx
import React, { useMemo } from 'react';

/** Compact timestamp: "11:19 PM" today, otherwise locale date */
function formatStamp(ts) {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString();
}

/** Best-effort pull of a string field from many possible keys */
function pickFirst(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v === undefined || v === null) continue;
    const s = String(v);
    if (s.trim() === '') continue;
    return v;
  }
  return undefined;
}

/** Actor-aware title from a normalized partner (user or vport) */
function titleFromPartner(p) {
  if (!p) return undefined;
  const isVport =
    (typeof p.kind === 'string' && p.kind.toLowerCase() === 'vport') ||
    (typeof p.actor_kind === 'string' && p.actor_kind.toLowerCase() === 'vport');

  if (isVport) {
    return (
      p.display_name ??
      p.name ??
      p.username ?? // sometimes slug is copied as username
      p.slug ??
      'VPORT'
    );
  }
  return p.display_name ?? p.username ?? 'User';
}

export default function ConversationPreview({ conversation, onClick }) {
  // ----- partner & title (actor-aware + legacy fallbacks) -------------------
  const partner =
    conversation?.partner ??
    // server-side flattened (from inbox_entries)
    {
      kind: conversation?.partner_kind,
      id: conversation?.partner_user_id || conversation?.partner_vport_id,
      display_name: conversation?.partner_display_name,
      username: conversation?.partner_username,
      photo_url: conversation?.partner_photo_url,
      avatar_url: conversation?.partner_photo_url,
      name: conversation?.partner_display_name, // vport fallback
      slug: conversation?.partner_username,     // vport fallback
    };

  const title =
    pickFirst(conversation, ['title', 'conversation_title']) ??
    titleFromPartner(partner) ??
    'Conversation';

  // ----- preview text (supports inbox preview or last message body) ---------
  const lastMessageRaw =
    pickFirst(conversation, [
      'lastMessage',        // caller-supplied
      'lastMessageText',    // caller-supplied
      'preview',            // caller-supplied
      'last_message_preview',
      'last_message_text',
    ]) ??
    (conversation?.last_message && conversation.last_message.body) ??
    '';

  // Single-line safe preview (strip hard newlines/tabs)
  const lastMessage = useMemo(
    () => String(lastMessageRaw || '').replace(/[\r\n\t]+/g, ' ').trim(),
    [lastMessageRaw]
  );

  // ----- timestamp (prefer server-maintained last_message_at) ---------------
  const stampSrc =
    pickFirst(conversation, [
      'lastMessageAt',
      'last_message_at',
      'updated_at',
      'updatedAt',
    ]);
  const stamp = formatStamp(stampSrc);

  // ----- unread count (server or client field) ------------------------------
  const unread =
    (Number.isFinite(conversation?.unread_count) && conversation.unread_count) ||
    (Number.isFinite(conversation?.unreadCount) && conversation.unreadCount) ||
    0;

  // ----- avatar --------------------------------------------------------------
  const avatarUrl =
    conversation?.avatarUrl ||
    partner?.photo_url ||
    partner?.avatar_url ||
    conversation?.partner_photo_url ||
    null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(conversation);
    }
  };

  return (
    <div
      className="p-3 border-b border-white/10 hover:bg-white/5 cursor-pointer text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      onClick={() => onClick?.(conversation)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open conversation: ${title}`}
      data-conversation-id={conversation?.id || ''}
    >
      <div className="flex items-center gap-3">
        {/* Avatar (optional) */}
        <div className="shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-white/10"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10" />
          )}
        </div>

        {/* Title + preview */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <div className="font-semibold truncate">{title}</div>
            {unread > 0 && (
              <span
                className="ml-auto inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-[#7c3aed] text-white/90"
                aria-label={`${unread} unread`}
                title={`${unread} unread`}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <div className="text-sm text-white/60 truncate">
            {lastMessage}
          </div>
        </div>

        {/* Timestamp (optional) */}
        <div className="shrink-0 pl-2 text-[11px] text-white/50">
          {stamp && (
            <time
              dateTime={stampSrc ? new Date(stampSrc).toISOString() : undefined}
              title={stamp}
            >
              {stamp}
            </time>
          )}
        </div>
      </div>
    </div>
  );
}
