// src/features/chat/ConversationList.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ConversationListItem from './ConversationListItem';

function summarize(msg) {
  if (!msg) return '';
  if (msg.media_type === 'image') return '📷 Photo';
  if (msg.media_type === 'video') return '🎞️ Video';
  if (msg.media_url && !msg.content) return '📎 Attachment';
  return msg.content || '';
}

const POLL_MS = 8000; // 0 to disable

export default function ConversationList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState(null);
  const [rows, setRows] = useState([]);
  const convIdSetRef = useRef(new Set());

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setErrText(null);

    // 1) my memberships (include archived_at & cleared_before)
    const { data: mems, error: mErr } = await supabase
      .from('conversation_members')
      .select('conversation_id, archived_at, cleared_before')
      .eq('user_id', user.id);

    if (mErr) {
      setErrText(mErr.message || 'Failed to load conversations.');
      setRows([]); setLoading(false); return;
    }

    const convIds = Array.from(new Set((mems || []).map(m => m.conversation_id)));
    convIdSetRef.current = new Set(convIds);

    if (convIds.length === 0) {
      setRows([]); setLoading(false); return;
    }

    // 2) conversation meta -> pick out VPORT-shadow DMs via pair_key='vpc:<vport_id>'
    const { data: convs, error: cErr } = await supabase
      .from('conversations')
      .select('id, pair_key')
      .in('id', convIds);

    if (cErr) {
      setErrText(cErr.message || 'Failed to load conversations.');
      setRows([]); setLoading(false); return;
    }

    const convById = new Map((convs || []).map(c => [c.id, c]));

    // map conv -> vport_id if it's a VPORT-shadow DM
    const vpcIdByConv = new Map();
    for (const c of convs || []) {
      const pk = c?.pair_key || '';
      if (pk.startsWith('vpc:')) vpcIdByConv.set(c.id, pk.slice(4));
    }

    // 2b) which VPORTs do *I* own/manage? (so we can HIDE those in citizen inbox)
    const [ownedResp, managedResp] = await Promise.all([
      supabase.from('vports').select('id').eq('created_by', user.id),
      supabase.from('vport_managers').select('vport_id').eq('manager_user_id', user.id),
    ]);

    const myVportIds = new Set([
      ...(ownedResp.data?.map(r => r.id) || []),
      ...(managedResp.data?.map(r => r.vport_id) || []),
    ]);

    // 3) recent messages across those conversations
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('conversation_id, content, media_url, media_type, created_at, shadow_of_vpm')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    if (msgErr) {
      setErrText(msgErr.message || 'Failed to load messages.');
      setRows(convIds.map(id => ({ conversation_id: id, created_at: null, lastMessage: '' })));
      setLoading(false); return;
    }

    // latest message per conversation
    const firstByConv = new Map();
    for (const m of msgs || []) {
      if (!firstByConv.has(m.conversation_id)) firstByConv.set(m.conversation_id, m);
    }

    // 4) Unarchive any archived conversations that got new messages after archive
    const toUnarchive = mems
      .filter(m => m.archived_at)
      .filter(m => {
        const last = firstByConv.get(m.conversation_id);
        return last && new Date(last.created_at) > new Date(m.archived_at);
      })
      .map(m => m.conversation_id);

    if (toUnarchive.length) {
      await supabase
        .from('conversation_members')
        .update({ archived_at: null })
        .in('conversation_id', toUnarchive)
        .eq('user_id', user.id);
      // reflect locally
      for (const m of mems) {
        if (toUnarchive.includes(m.conversation_id)) m.archived_at = null;
      }
    }

    // 5) Build visible list (respect archived + cleared_before)
    const cutByConv = new Map(mems.map(m => [m.conversation_id, m.cleared_before || null]));
    const visibleIdsRaw = new Set(mems.filter(m => !m.archived_at).map(m => m.conversation_id));

    // 5a) HIDE VPORT-shadow convs where the VPORT belongs to me (owned/managed)
    const visibleIds = Array.from(visibleIdsRaw).filter(id => {
      const vpcId = vpcIdByConv.get(id);
      if (!vpcId) return true;           // normal citizen DM
      return !myVportIds.has(vpcId);     // drop my own VPORT DMs from citizen inbox
    });

    // 5b) fetch VPORT display for the *remaining* VPC convs so recipients see name/avatar
    const neededVportIds = Array.from(
      new Set(visibleIds.map(id => vpcIdByConv.get(id)).filter(Boolean))
    );
    let vportById = new Map();
    if (neededVportIds.length) {
      const { data: vps } = await supabase
        .from('vports')
        .select('id, name, avatar_url')
        .in('id', neededVportIds);
      vportById = new Map((vps || []).map(v => [v.id, v]));
    }

    const next = visibleIds.map(id => {
      const cut = cutByConv.get(id);
      const m   = firstByConv.get(id);
      const show = m && (!cut || new Date(m.created_at) > new Date(cut)) ? m : null;

      // Partner override for VPORT-shadow DMs (recipient view)
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
      };
    });

    next.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    setRows(next);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { if (user?.id) load(); }, [user?.id, load]);

  // manual refresh helpers
  useEffect(() => {
    if (!user?.id) return;
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.id, load]);

  // OPTIONAL polling
  useEffect(() => {
    if (!user?.id || !POLL_MS) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [user?.id, load]);

  const handleOpen = (id) => navigate(`/chat/${id}`);
  const handleRemove = (id) => {
    setRows(prev => prev.filter(r => r.conversation_id !== id));
    const s = new Set(convIdSetRef.current); s.delete(id); convIdSetRef.current = s;
  };

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

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

      {errText && (
        <div className="px-3 py-2 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded">
          {errText}
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
          onClick={() => handleOpen(r.conversation_id)}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
