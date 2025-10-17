// src/features/chat/vchat/VConversationList.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { supabaseVc } from '@/lib/supabaseClientVc'; // <-- add
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import ConversationListItem from '@/features/chat/ConversationListItem';
import { Plus } from 'lucide-react';
import { emitUnreadDelta } from '@/features/chat/events/badge';

function summarize(msg) {
  if (!msg) return '';
  const mt = (msg?.media_type || '').toLowerCase();
  const isImage = mt === 'image' || mt.startsWith('image/');
  const isVideo = mt === 'video' || mt.startsWith('video/');
  if (isImage) return '📷 Photo';
  if (isVideo) return '🎞️ Video';
  if (msg?.media_url && !msg?.content) return '📎 Attachment';
  return msg?.content || '';
}

const POLL_MS = 60000;

export default function VConversationList({ activeId }) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const navigate = useNavigate();

  const vportId = identity?.type === 'vport' ? identity?.vportId : null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errText, setErrText] = useState(null);
  const [rows, setRows] = useState([]);
  const convIdSetRef = useRef(new Set());

  const load = useCallback(
    async ({ soft = false } = {}) => {
      if (!user?.id || !vportId) return;

      if (soft) setRefreshing(true);
      else setLoading(true);
      setErrText(null);

      try {
        // 1) Server-side filtered VPORT inbox (vc schema RPC)
        const { data: inbox, error: inboxErr } = await supabaseVc.rpc('get_vport_inbox', {
          p_vport_id: vportId,
          p_owner_user_id: user.id,
          p_limit: 200,
          p_offset: 0,
        });
        if (inboxErr) { setErrText(inboxErr.message); return; }

        const convIds = (inbox || []).map(r => r.conversation_id);
        convIdSetRef.current = new Set(convIds);
        if (convIds.length === 0) { setRows([]); return; }

        // 2) Unread counts snapshot (table query via normal client)
        const { data: unreadRows, error: uErr } = await supabase
          .schema('vc')
          .from('inbox_entries')
          .select('conversation_id, unread_count')
          .eq('user_id', user.id)
          .in('conversation_id', convIds);
        if (uErr) console.warn('[VConversationList] unread fetch error:', uErr);

        const unreadByConv = new Map(
          (unreadRows || []).map(r => [r.conversation_id, Number(r.unread_count || 0)])
        );

        // 3) Prefetch partner (human) profiles for chip
        const partnerIds = Array.from(new Set((inbox || [])
          .map(r => r.partner_user_id)
          .filter(Boolean)));

        let partnerById = new Map();
        if (partnerIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, display_name, username, photo_url')
            .in('id', partnerIds);
          partnerById = new Map((profs || []).map(p => [p.id, p]));
        }

        // 4) Map to UI rows
        const next = (inbox || []).map(r => {
          const p = r.partner_user_id ? partnerById.get(r.partner_user_id) : null;
          const partner = r.partner_user_id
            ? {
                id: r.partner_user_id,
                display_name: (p?.display_name || p?.username || 'Someone')?.trim(),
                photo_url: p?.photo_url || '/avatar.jpg',
                partner_type: 'user',
              }
            : undefined;

          return {
            conversation_id: r.conversation_id,
            created_at: r.last_message_at || null,
            lastMessage: summarize({ content: r.last_message }),
            partner,
            unread_count: unreadByConv.get(r.conversation_id) ?? 0,
          };
        });

        next.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });

        setRows(next);
      } finally {
        if (soft) setRefreshing(false);
        else setLoading(false);
      }
    },
    [user?.id, vportId]
  );

  useEffect(() => { if (user?.id && vportId) load({ soft: false }); }, [user?.id, vportId, load]);

  useEffect(() => {
    if (!user?.id || !vportId) return;
    const onFocus = () => load({ soft: true });
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.id, vportId, load]);

  useEffect(() => {
    if (!user?.id || !vportId || !POLL_MS) return;
    const t = setInterval(() => load({ soft: true }), POLL_MS);
    return () => clearInterval(t);
  }, [user?.id, vportId, load]);

  const handleOpen = (id) => {
    const row = rows.find(r => r.conversation_id === id);
    const delta = row ? -Number(row.unread_count || 0) : 0;
    if (delta) emitUnreadDelta(delta);

    setRows(prev => prev.map(r =>
      r.conversation_id === id ? { ...r, unread_count: 0 } : r
    ));

    supabase
      .schema('vc')
      .from('inbox_entries')
      .update({ unread_count: 0 })
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .then(() => {}, () => {});

    navigate(`/vport/chat/${id}`);
  };

  const handleRemove = (id) => {
    setRows(prev => prev.filter(r => r.conversation_id !== id));
    const s = new Set(convIdSetRef.current); s.delete(id); convIdSetRef.current = s;
  };

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  if (!vportId) {
    return (
      <div className="p-3 max-w-3xl mx-auto text-sm text-red-300">
        Switch to a VPORT to view the VPORT inbox.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-white/70 font-medium">VPORT Inbox</div>
        <div className="flex items-center gap-3">
          {(refreshing && rows.length > 0) && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="w-3 h-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
              Updating…
            </div>
          )}
          <button className="p-1.5 rounded-full hover:bg-neutral-800 transition" aria-label="New Message">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {errText && (
        <div className="px-3 py-2 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded">
          {errText}
        </div>
      )}

      {loading && rows.length === 0 && (
        <div className="space-y-2 mt-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center p-2 rounded bg-neutral-900/50 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-neutral-800" />
              <div className="ml-3 flex-1">
                <div className="h-4 w-40 bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-64 bg-neutral-800 rounded" />
              </div>
              <div className="w-24 h-4 bg-neutral-800 rounded ml-3" />
            </div>
          ))}
        </div>
      )}

      {!loading && empty && (
        <div className="text-center text-sm text-gray-400 py-8">No conversations yet.</div>
      )}

      {!loading && rows.map(r => (
        <ConversationListItem
          key={r.conversation_id}
          conversationId={r.conversation_id}
          createdAt={r.created_at}
          lastMessage={r.lastMessage}
          partner={r.partner}
          unreadCount={r.unread_count}
          isActive={r.conversation_id === activeId}
          onClick={() => handleOpen(r.conversation_id)}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
