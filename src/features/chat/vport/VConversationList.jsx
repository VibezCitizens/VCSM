// src/features/chat/vport/VConversationList.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import VConversationListItem from './VConversationListItem';

const summarize = (m) => {
  if (!m) return '';
  if (m.media_type === 'image') return '📷 Photo';
  if (m.media_type === 'video') return '🎞️ Video';
  if (m.media_url && !m.content) return '📎 Attachment';
  return m.content || '';
};

export default function VConversationList() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const navigate = useNavigate();

  const viewerVportId = identity?.type === 'vport' ? identity.vportId : null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setErr(null);

    try {
      // 1) My membership rows
      const { data: mems, error: mErr } = await supabase
        .from('vport_conversation_members')
        .select('conversation_id, cleared_before')
        .eq('user_id', user.id)
        .is('archived_at', null);

      if (mErr) throw mErr;

      const convIds = (mems || []).map((m) => m.conversation_id);
      if (convIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const cutByConv = new Map(
        (mems || []).map((m) => [m.conversation_id, m.cleared_before || null])
      );

      // 2) Conversation meta + latest messages
      const [convsResp, msgsResp] = await Promise.all([
        supabase
          .from('vport_conversations')
          .select('id, vport_id, vport:vports ( id, name, avatar_url )')
          .in('id', convIds),

        supabase
          .from('vport_messages')
          .select('id, conversation_id, sender_user_id, content, media_url, media_type, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false }),
      ]);

      if (convsResp.error) throw convsResp.error;
      if (msgsResp.error) throw msgsResp.error;

      const convById = new Map((convsResp.data || []).map((c) => [c.id, c]));

      // newest visible message after cleared_before
      const firstMsgByConv = new Map();
      for (const m of msgsResp.data || []) {
        const cut = cutByConv.get(m.conversation_id);
        if (cut && m.created_at <= cut) continue;
        if (!firstMsgByConv.has(m.conversation_id)) firstMsgByConv.set(m.conversation_id, m);
      }

      // 3) Resolve partner WITHOUT RPC (managerless)
      // Guess partner from messages: first message by a different user
      const guessedPartnerIdByConv = new Map();
      for (const m of msgsResp.data || []) {
        if (
          !guessedPartnerIdByConv.has(m.conversation_id) &&
          m.sender_user_id &&
          m.sender_user_id !== user.id
        ) {
          guessedPartnerIdByConv.set(m.conversation_id, m.sender_user_id);
        }
      }

      const fallbackIds = Array.from(new Set([...guessedPartnerIdByConv.values()].filter(Boolean)));
      const partnerByConv = new Map();

      if (fallbackIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', fallbackIds);

        if (profs?.length) {
          const profById = new Map(profs.map((p) => [p.id, p]));
          for (const [cid, pid] of guessedPartnerIdByConv.entries()) {
            const prof = profById.get(pid);
            if (prof) partnerByConv.set(cid, prof);
          }
        }
      }

      // 4) Build UI rows
      const next = convIds.map((id) => {
        const conv = convById.get(id);
        const last = firstMsgByConv.get(id);

        let partner;
        if (viewerVportId && conv?.vport_id === viewerVportId) {
          // acting as the VPORT, show the user partner
          const prof = partnerByConv.get(id);
          partner = prof
            ? {
                id: prof.id,
                display_name: prof.display_name || prof.username || 'User',
                photo_url: prof.photo_url || '/default.png',
                partner_type: 'user',
              }
            : {
                id: null,
                display_name: 'Unknown User',
                photo_url: '/default.png',
                partner_type: 'user',
              };
        } else {
          // not acting as that VPORT — show the VPORT itself
          partner = {
            id: conv?.vport?.id || conv?.vport_id,
            display_name: conv?.vport?.name || 'VPORT',
            photo_url: conv?.vport?.avatar_url || '/default.png',
            partner_type: 'vport',
          };
        }

        return {
          conversation_id: id,
          created_at: last?.created_at || null,
          lastMessage: summarize(last),
          partner,
        };
      });

      next.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setRows(next);
      setLoading(false);
    } catch (e) {
      setErr(e?.message || 'Load failed.');
      setRows([]);
      setLoading(false);
    }
  }, [user?.id, viewerVportId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-white/70">Inbox</div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {err && (
        <div className="px-3 py-2 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded">
          {err}
        </div>
      )}

      {loading && (
        <div className="space-y-2 mt-1">
          {[...Array(6)].map((_, i) => (
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

      {!loading && rows.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-8">No conversations yet.</div>
      )}

      {!loading &&
        rows.map((r) => (
          <VConversationListItem
            key={r.conversation_id}
            conversationId={r.conversation_id}
            createdAt={r.created_at}
            lastMessage={r.lastMessage}
            partner={r.partner}
            onClick={() => navigate(`/vchat/${r.conversation_id}`)}
            onRemove={(id) => setRows((prev) => prev.filter((x) => x.conversation_id !== id))}
          />
        ))}
    </div>
  );
}
