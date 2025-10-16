// src/features/chat/ConversationList.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
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
        // 1) My memberships
        const { data: mems, error: mErr } = await supabase
          .schema('vc')
          .from('conversation_members')
          .select('conversation_id, archived_at, cleared_before')
          .eq('user_id', user.id);

        if (mErr) {
          setErrText(mErr.message || 'Failed to load conversations.');
          return;
        }

        const convIds = Array.from(new Set((mems || []).map(m => m.conversation_id)));
        convIdSetRef.current = new Set(convIds);

        if (convIds.length === 0) {
          setRows([]);
          return;
        }

        // 2a) My unread counts (vc.inbox_entries)
        const { data: inboxRows, error: iErr } = await supabase
          .schema('vc')
          .from('inbox_entries')
          .select('conversation_id, user_id, unread_count, last_message_at')
          .eq('user_id', user.id)
          .in('conversation_id', convIds);

        if (iErr) {
          setErrText(iErr.message || 'Failed to load inbox entries.');
          return;
        }

        const unreadByConv = new Map(
          (inboxRows || []).map(r => [r.conversation_id, Number(r.unread_count || 0)])
        );

        // 2b) Conversations meta (for vport detection)
        const { data: convs, error: cErr } = await supabase
          .schema('vc')
          .from('conversations')
          .select('id, pair_key')
          .in('id', convIds);

        if (cErr) {
          setErrText(cErr.message || 'Failed to load conversations.');
          return;
        }

        const vpcIdByConv = new Map();
        for (const c of convs || []) {
          const pk = c?.pair_key || '';
          if (pk.startsWith('vpc:')) vpcIdByConv.set(c.id, pk.slice(4));
        }

        // 2c) Which VPORTs do I own?
        const ownedResp = await supabase
          .schema('vc')
          .from('vports')
          .select('id')
          .eq('created_by', user.id);
        const myVportIds = new Set(ownedResp.data?.map(r => r.id) || []);

        // 3) Recent messages per conversation
        const { data: msgs, error: msgErr } = await supabase
          .schema('vc')
          .from('messages')
          .select('conversation_id, content, media_url, media_type, created_at, shadow_of_vpm')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false });

        if (msgErr) {
          setErrText(msgErr.message || 'Failed to load messages.');
          return;
        }

        const firstByConv = new Map();
        for (const m of msgs || []) {
          if (!firstByConv.has(m.conversation_id)) firstByConv.set(m.conversation_id, m);
        }

        // 4) Unarchive if new messages after archive
        const toUnarchive = (mems || [])
          .filter(m => m.archived_at)
          .filter(m => {
            const last = firstByConv.get(m.conversation_id);
            return last && new Date(last.created_at) > new Date(m.archived_at);
          })
          .map(m => m.conversation_id);

        if (toUnarchive.length) {
          await supabase
            .schema('vc')
            .from('conversation_members')
            .update({ archived_at: null })
            .in('conversation_id', toUnarchive)
            .eq('user_id', user.id);

          for (const m of mems) {
            if (toUnarchive.includes(m.conversation_id)) m.archived_at = null;
          }
        }

        // 5) Build visible list (skip archived + skip vports I own)
        const cutByConv = new Map(mems.map(m => [m.conversation_id, m.cleared_before || null]));
        const visibleIdsRaw = new Set(mems.filter(m => !m.archived_at).map(m => m.conversation_id));

        const visibleIds = Array.from(visibleIdsRaw).filter(id => {
          const vpcId = vpcIdByConv.get(id);
          if (!vpcId) return true;
          return !myVportIds.has(vpcId);
        });

        // 6) Prefetch needed VPORT info for partner display
        const neededVportIds = Array.from(
          new Set(visibleIds.map(id => vpcIdByConv.get(id)).filter(Boolean))
        );

        let vportById = new Map();
        if (neededVportIds.length) {
          const { data: vps } = await supabase
            .schema('vc')
            .from('vports')
            .select('id, name, avatar_url')
            .in('id', neededVportIds);
          vportById = new Map((vps || []).map(v => [v.id, v]));
        }

        // 7) Build rows
        const next = visibleIds.map(id => {
          const cut = cutByConv.get(id);
          const m   = firstByConv.get(id);
          const show = m && (!cut || new Date(m.created_at) > new Date(cut)) ? m : null;

          let partner = undefined;
          const vpcId = vpcIdByConv.get(id);
          if (vpcId) {
            const vp = vportById.get(vpcId);
            partner = {
              id: vpcId,
              display_name: vp?.name || 'VPORT',
              photo_url: vp?.avatar_url || '/default.png',
              partner_type: 'vport',
            };
          }

          return {
            conversation_id: id,
            created_at: show?.created_at || null,
            lastMessage: summarize(show),
            partner,
            unread_count: unreadByConv.get(id) || 0,
          };
        });

        // Sort by latest activity desc
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

  // First load
  useEffect(() => {
    if (user?.id) load({ soft: false });
  }, [user?.id, load]);

  // Focus / visibility refresh
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

  // Background poll
  useEffect(() => {
    if (!user?.id || !POLL_MS) return;
    const t = setInterval(() => load({ soft: true }), POLL_MS);
    return () => clearInterval(t);
  }, [user?.id, load]);

  const handleOpen = (id) => {
    const row = rows.find(r => r.conversation_id === id);
    const delta = row ? -Number(row.unread_count || 0) : 0;
    if (delta) emitUnreadDelta(delta); // instant bottom-badge drop

    // Optimistically clear this row’s unread
    setRows(prev =>
      prev.map(r =>
        r.conversation_id === id ? { ...r, unread_count: 0 } : r
      )
    );

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
              <span
                className="w-3 h-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin"
                aria-hidden
              />
              Updating…
            </div>
          )}
          <button
            className="p-1.5 rounded-full hover:bg-neutral-800 transition"
            aria-label="New Message"
            // TODO: wire up compose flow
          >
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
