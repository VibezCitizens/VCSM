// src/features/chat/vchat/VConversationList.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import ConversationListItem from '@/features/chat/ConversationListItem';
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

/**
 * VPORT-only inbox:
 * - Uses the *user's* membership (conversation_members.user_id == auth user)
 * - Filters to conversations whose `pair_key` starts with `vpc:<vport_id>`
 * - Shows the *other human* (partner_user_id) as the partner chip
 * - Navigates to /vport/chat/:id
 */
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
        // 1) My memberships (user-based)
        const { data: mems, error: mErr } = await supabase
          .schema('vc')
          .from('conversation_members')
          .select('conversation_id, archived_at, cleared_before, partner_user_id')
          .eq('user_id', user.id);

        if (mErr) {
          setErrText(mErr.message || 'Failed to load conversations.');
          return;
        }

        const convIdsAll = Array.from(new Set((mems || []).map(m => m.conversation_id)));
        if (convIdsAll.length === 0) {
          convIdSetRef.current = new Set();
          setRows([]);
          return;
        }

        // 2) Get conversations to detect vport pairing (pair_key)
        const { data: convs, error: cErr } = await supabase
          .schema('vc')
          .from('conversations')
          .select('id, pair_key')
          .in('id', convIdsAll);

        if (cErr) {
          setErrText(cErr.message || 'Failed to load conversations meta.');
          return;
        }

        // Keep only convs that belong to this VPORT (pair_key starts with `vpc:<vportId>`)
        const vpcPrefix = `vpc:${vportId}`;
        const convIds = (convs || [])
          .filter(c => (c?.pair_key || '').startsWith(vpcPrefix))
          .map(c => c.id);

        convIdSetRef.current = new Set(convIds);

        if (convIds.length === 0) {
          setRows([]);
          return;
        }

        // 3) My unread counts (vc.inbox_entries)
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

        // 4) Recent messages per conversation
        const { data: msgs, error: msgErr } = await supabase
          .schema('vc')
          .from('messages')
          .select('conversation_id, content, media_url, media_type, created_at')
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

        // 5) Unarchive if new messages after archive
        const memsForKept = (mems || []).filter(m => convIdSetRef.current.has(m.conversation_id));
        const toUnarchive = memsForKept
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
          for (const m of memsForKept) {
            if (toUnarchive.includes(m.conversation_id)) m.archived_at = null;
          }
        }

        // 6) Build visible list: skip archived
        const cutByConv = new Map(memsForKept.map(m => [m.conversation_id, m.cleared_before || null]));
        const visibleIds = memsForKept
          .filter(m => !m.archived_at)
          .map(m => m.conversation_id);

        // Grab partner_user_id for these (human partner)
        const partnerByConv = new Map(memsForKept.map(m => [m.conversation_id, m.partner_user_id || null]));
        const neededPartnerIds = Array.from(
          new Set(memsForKept.map(m => m.partner_user_id).filter(Boolean))
        );

        // 7) Prefetch partner profiles (display chip)
        let partnerProfileById = new Map();
        if (neededPartnerIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, display_name, username, photo_url')
            .in('id', neededPartnerIds);
          partnerProfileById = new Map((profs || []).map(p => [p.id, p]));
        }

        // 8) Build rows
        const next = visibleIds.map(id => {
          const cut = cutByConv.get(id);
          const m   = firstByConv.get(id);
          const show = m && (!cut || new Date(m.created_at) > new Date(cut)) ? m : null;

          // Partner = the human
          let partner = undefined;
          const partnerUserId = partnerByConv.get(id);
          if (partnerUserId) {
            const p = partnerProfileById.get(partnerUserId);
            partner = {
              id: partnerUserId,
              display_name: p?.display_name || p?.username || 'Someone',
              photo_url: p?.photo_url || '/avatar.jpg',
              partner_type: 'user',
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
    [user?.id, vportId]
  );

  // First load
  useEffect(() => {
    if (user?.id && vportId) load({ soft: false });
  }, [user?.id, vportId, load]);

  // Focus / visibility refresh
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

  // Background poll
  useEffect(() => {
    if (!user?.id || !vportId || !POLL_MS) return;
    const t = setInterval(() => load({ soft: true }), POLL_MS);
    return () => clearInterval(t);
  }, [user?.id, vportId, load]);

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
            // TODO: wire up compose as VPORT (actor = vportId)
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
