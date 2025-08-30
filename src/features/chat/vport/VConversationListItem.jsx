// C:\Users\vibez\OneDrive\Desktop\VCSM\src\features\chat\vport\VConversationListItem.jsx
import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString();
}

export default function VConversationListItem({
  conversationId,
  createdAt,
  lastMessage,
  partner,
  onClick,
  onRemove,
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const subtitle = useMemo(() => lastMessage || '', [lastMessage]);
  const displayName = partner?.display_name || 'Unknown';
  const avatarUrl   = partner?.photo_url || '/default.png';

  const handleHide = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;
    if (!window.confirm('Hide this conversation for you?')) return;

    setBusy(true);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('vport_conversation_members')
      .update({ archived_at: nowIso, cleared_before: nowIso })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    setBusy(false);

    if (error) {
      console.error('[VConversationListItem] hide error:', error);
      return;
    }
    onRemove?.(conversationId);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition cursor-pointer"
      aria-disabled={busy}
    >
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-10 h-10 rounded-full object-cover border border-neutral-700"
        onError={(e) => { e.currentTarget.src = '/default.png'; }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm text-white font-medium truncate">{displayName}</div>
          <div className="text-[11px] text-gray-500 shrink-0">{timeAgo(createdAt)}</div>
        </div>
        <div className="text-xs text-gray-400 truncate">{subtitle}</div>
      </div>

      <button
        type="button"
        onClick={handleHide}
        className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white disabled:opacity-50"
        disabled={busy}
        title="Hide conversation"
      >
        {busy ? 'Hiding…' : 'Hide'}
      </button>
    </div>
  );
}
