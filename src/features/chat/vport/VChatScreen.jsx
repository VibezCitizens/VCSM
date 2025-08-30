// C:\Users\vibez\OneDrive\Desktop\VCSM\src\features\chat\vport\VChatScreen.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';

import VChatHeader from './VChatHeader';
import VMessageItem from './VMessageItem';
import VMessageInput from './VMessageInput';

const SELECT_V_COLS = `
  id,
  conversation_id,
  sender_user_id,
  sender_vport_id,
  content,
  media_url,
  media_type,
  created_at
`;

export default function VChatScreen() {
  const { id: conversationId } = useParams(); // vport_conversations.id
  const { user } = useAuth();
  const { identity } = useIdentity();

  const [convVportId, setConvVportId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState(null);
  const [clearedBefore, setClearedBefore] = useState(null);

  const endRef = useRef(null);
  const lastSeenRef = useRef(null);

  const scrollToEnd = useCallback((behavior = 'auto') => {
    endRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  // Load vport_id of this conversation (for header/permissions)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!conversationId) return;
      const { data, error } = await supabase
        .from('vport_conversations')
        .select('vport_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!cancelled) {
        if (error) console.error('[VChatScreen] vport_id load error', error);
        setConvVportId(data?.vport_id ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Initial load: membership -> messages (respect cleared_before)
  useEffect(() => {
    let cancelled = false;
    if (!conversationId || !user?.id) return;

    (async () => {
      setLoading(true);
      setErrText(null);

      const { data: me, error: mErr } = await supabase
        .from('vport_conversation_members')
        .select('cleared_before')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (mErr || !me) {
        setErrText("You don't have access to this conversation.");
        setMessages([]);
        setClearedBefore(null);
        setLoading(false);
        return;
      }

      const cut = me.cleared_before || null;
      setClearedBefore(cut);

      let q = supabase
        .from('vport_messages')
        .select(SELECT_V_COLS)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (cut) q = q.gt('created_at', cut);

      const { data, error } = await q;

      if (cancelled) return;

      if (error) {
        console.error('[VChatScreen] load error', error);
        setErrText(error.message || 'Failed to load messages.');
        setMessages([]);
        lastSeenRef.current = cut;
      } else {
        const list = data || [];
        setMessages(list);
        lastSeenRef.current = list.length ? list[list.length - 1].created_at : cut;
      }

      setLoading(false);
      setTimeout(() => scrollToEnd('auto'), 0);
    })();

    return () => {
      cancelled = true;
      setMessages([]);
      setClearedBefore(null);
      lastSeenRef.current = null;
    };
  }, [conversationId, user?.id, scrollToEnd]);

  // Catch-up on focus/visibility
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const fetchCatchUp = async () => {
      const since = lastSeenRef.current || clearedBefore;
      if (!since) return;

      const { data, error } = await supabase
        .from('vport_messages')
        .select(SELECT_V_COLS)
        .eq('conversation_id', conversationId)
        .gt('created_at', since)
        .order('created_at', { ascending: true });

      if (error || !data?.length) return;

      setMessages(prev => {
        const merged = [...prev, ...data];
        lastSeenRef.current = merged[merged.length - 1].created_at;
        return merged;
      });

      setTimeout(() => scrollToEnd('smooth'), 0);
    };

    const onVis = () => { if (!document.hidden) fetchCatchUp(); };
    window.addEventListener('focus', fetchCatchUp);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('focus', fetchCatchUp);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [conversationId, user?.id, clearedBefore, scrollToEnd]);

  // Can current identity send as the convo's VPORT?
  const canSendAsVport = useMemo(() =>
    identity?.type === 'vport' &&
    identity?.vportId &&
    convVportId &&
    identity.vportId === convVportId
  , [identity?.type, identity?.vportId, convVportId]);

  return (
    <div className="flex flex-col h-full bg-black">
      <VChatHeader conversationId={conversationId} currentUserId={user?.id} />

      {/* scroll region */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ paddingBottom: '7rem' }}>
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-neutral-900/50 rounded animate-pulse" />
            ))}
          </div>
        ) : errText ? (
          <div className="px-3 py-2 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded">
            {errText}
          </div>
        ) : (
          <>
            {messages.map(m => (
              <VMessageItem key={m.id} message={m} currentUserId={user?.id} />
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* fixed composer (bottom) */}
      <div className="sticky bottom-0 z-10 bg-black/80 backdrop-blur border-t border-neutral-800 p-3">
        <VMessageInput
          conversationId={conversationId}
          forceVportId={canSendAsVport ? identity.vportId : null}
          onSent={(m) => {
            if (!m) return;
            setMessages(prev => [...prev, m]);
            lastSeenRef.current = m.created_at || lastSeenRef.current;
            setTimeout(() => scrollToEnd('smooth'), 0);
          }}
        />
      </div>
    </div>
  );
}
