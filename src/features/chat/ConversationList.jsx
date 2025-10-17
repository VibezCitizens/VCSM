// src/features/chat/ConversationList.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { supabaseVc } from '@/lib/supabaseClientVc';
import { useAuth } from '@/hooks/useAuth';
import ConversationListItem from './ConversationListItem';
import { Plus } from 'lucide-react';
import { emitUnreadDelta } from '@/features/chat/events/badge';

function summarize(msg) {
  if (!msg) return '';
  const mt = (msg.media_type || '').toLowerCase();
  const isImage = mt === 'image' || mt.startsWith('image/');
  const isVideo = mt === 'video' || mt.startsWith('video/');
  if (isImage) return '📷 Photo';
  if (isVideo) return '🎞️ Video';
  if (msg.media_url && !msg.content) return '📎 Attachment';
  return msg.content || '';
}

// Background poll every 60s (set to 0 to disable)
const POLL_MS = 60000;

export default function ConversationList({ activeId }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errText, setErrText] = useState(null);
  const [rows, setRows] = useState([]);
  const convIdSetRef = useRef(new Set());

  const load = useCallback(
    async ({ soft = false } = {}) => {
      if (!user?.id) return;

      if (soft) setRefreshing(true);
      else setLoading(true);

      setErrText(null);

      try {
        // 1) Server-side filtered inbox (vc schema RPC)
        const { data: inbox, error: inboxErr } = await supabaseVc.rpc('get_user_inbox', {
          p_user_id: user.id,
          p_limit: 200,
          p_offset: 0,
        });
        if (inboxErr) {
          setErrText(inboxErr.message || 'Failed to load conversations.');
          return;
        }

        const convIds = (inbox || []).map(r => r.conversation_id);
        convIdSetRef.current = new Set(convIds);

        if (convIds.length === 0) { setRows([]); return; }

        // 2) Snapshot from inbox_entries: unread + last_message_id (one row per conv)
        const { data: inboxSnap, error: snapErr } = await supabase
          .schema('vc')
          .from('inbox_entries')
          .select('conversation_id, unread_count, last_message_id')
          .eq('user_id', user.id)
          .in('conversation_id', convIds);

        if (snapErr) console.warn('[ConversationList] inbox snap error:', snapErr);

        const unreadByConv = new Map(
          (inboxSnap || []).map(r => [r.conversation_id, Number(r.unread_count || 0)])
        );
        const lastMsgIdByConv = new Map(
          (inboxSnap || []).filter(r => r.last_message_id).map(r => [r.conversation_id, r.last_message_id])
        );

        // 2b) Resolve latest actors via last_message_id → messages.actor_id
        const lastMsgIds = Array.from(new Set((inboxSnap || []).map(r => r.last_message_id).filter(Boolean)));
        let actorIdByConv = new Map();
        if (lastMsgIds.length) {
          const { data: msgRows, error: msgErr } = await supabase
            .schema('vc')
            .from('messages')
            .select('id, actor_id, conversation_id')
            .in('id', lastMsgIds);
          if (msgErr) console.warn('[ConversationList] messages lookup error:', msgErr);
          actorIdByConv = new Map((msgRows || []).map(m => [m.conversation_id, m.actor_id]));
        }

        // 2c) Load actor metadata for those actors
        const actorIds = Array.from(new Set(Array.from(actorIdByConv.values()).filter(Boolean)));
        let actorById = new Map();
        if (actorIds.length) {
          const { data: actorRows, error: actorErr } = await supabase
            .schema('vc')
            .from('actors')
            .select('id, kind, vport_id')
            .in('id', actorIds);
          if (actorErr) console.warn('[ConversationList] actors lookup error:', actorErr);
          actorById = new Map((actorRows || []).map(a => [a.id, a]));
        }

        // 2d) For VPORT actors, pull vport display info once
        const vportIds = Array.from(
          new Set(Array.from(actorById.values()).filter(a => a.kind === 'vport' && a.vport_id).map(a => a.vport_id))
        );
        let vportById = new Map();
        if (vportIds.length) {
          const { data: vports, error: vErr } = await supabase
            .schema('vc')
            .from('vports')
            .select('id, name, avatar_url')
            .in('id', vportIds);
          if (vErr) console.warn('[ConversationList] vports lookup error:', vErr);
          vportById = new Map((vports || []).map(v => [v.id, v]));
        }

        // 3) Prefetch partner profiles for USER path (non-vport)
        const partnerIds = Array.from(
          new Set((inbox || []).map(r => r.other_side?.user_id).filter(Boolean))
        );
        let partnerById = new Map();
        if (partnerIds.length) {
          const { data: profs, error: profErr } = await supabase
            .from('profiles')
            .select('id, display_name, username, photo_url')
            .in('id', partnerIds);
          if (profErr) console.warn('[ConversationList] profiles lookup error:', profErr);
          partnerById = new Map((profs || []).map(p => [p.id, p]));
        }

        // 4) Map to UI rows — prefer VPORT partner when last actor is a vport
        const next = (inbox || []).map(r => {
          const convId = r.conversation_id;
          const actorId = actorIdByConv.get(convId);
          const actor = actorId ? actorById.get(actorId) : null;

          let partner = undefined;

          if (actor && actor.kind === 'vport' && actor.vport_id) {
            const v = vportById.get(actor.vport_id);
            if (v) {
              partner = {
                id: v.id,
                display_name: (v.name || 'VPORT')?.trim(),
                photo_url: v.avatar_url || '/default.png',
                partner_type: 'vport',
              };
            }
          }

          // Fallback to USER chip from RPC other_side
          if (!partner) {
            const partnerUserId = r.other_side?.user_id || null;
            if (partnerUserId) {
              const p = partnerById.get(partnerUserId);
              partner = {
                id: partnerUserId,
                display_name: (p?.display_name || p?.username || 'User')?.trim(),
                photo_url: p?.photo_url || '/default.png',
                partner_type: 'user',
              };
            }
          }

          return {
            conversation_id: convId,
            created_at: r.last_message_at || null,
            lastMessage: r.last_message || '',
            partner,
            unread_count: unreadByConv.get(convId) ?? 0,
            // (optional) keep for future: last_message_id: lastMsgIdByConv.get(convId),
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
    [user?.id]
  );

  useEffect(() => { if (user?.id) load({ soft: false }); }, [user?.id, load]);

  useEffect(() => {
    if (!user?.id) return;
    const onFocus = () => load({ soft: true });
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.id, load]);

  useEffect(() => {
    if (!user?.id || !POLL_MS) return;
    const t = setInterval(() => load({ soft: true }), POLL_MS);
    return () => clearInterval(t);
  }, [user?.id, load]);

  const handleOpen = (id) => {
    const row = rows.find(r => r.conversation_id === id);
    const delta = row ? -Number(row.unread_count || 0) : 0;
    if (delta) emitUnreadDelta(delta);

    setRows(prev => prev.map(r => r.conversation_id === id ? { ...r, unread_count: 0 } : r));

    supabase
      .schema('vc')
      .from('inbox_entries')
      .update({ unread_count: 0 })
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .then(() => {}, () => {});

    navigate(`/chat/${id}`);
  };

  const handleRemove = (id) => {
    setRows(prev => prev.filter(r => r.conversation_id !== id));
    const s = new Set(convIdSetRef.current); s.delete(id); convIdSetRef.current = s;
  };

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  return (
    <div className="p-3 space-y-2 max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-white/70 font-medium">VDrop Inbox</div>
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
          partner={r.partner}            // already resolved (vport or user) → no flicker
          unreadCount={r.unread_count}
          isActive={r.conversation_id === activeId}
          onClick={() => handleOpen(r.conversation_id)}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
