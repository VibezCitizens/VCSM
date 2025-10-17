// src/features/chat/vchat/VChatScreen.jsx
// Same UI as ChatScreen, but uses the VPort data provider.
import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';             // ✅ added
import { supabase } from '@/lib/supabaseClient';                    // ✅ added
import ChatHeader from '@/features/chat/components/ChatHeader';
import MessageItem from '@/features/chat/MessageItem';
import MessageInput from '@/features/chat/MessageInput';
import vchat from '@/data/vport/vchat/chat'; // ✅ default import

const byCreatedAsc = (a, b) => new Date(a.created_at) - new Date(b.created_at);
const dedupeById = (arr) => { const m = new Map(); for (const x of arr) m.set(x.id, x); return [...m.values()]; };
const applyCut = (arr, cut) => (cut ? arr.filter(m => new Date(m.created_at) > new Date(cut)) : arr);

const DEFAULT_HEADER_H = 56;
const DEFAULT_INPUT_H  = 84;

// local helper to parse pair_key -> vportId (same logic as data provider)
function extractVportIdFromPairKey(pairKey) {
  if (!pairKey || typeof pairKey !== 'string' || !pairKey.startsWith('vpc:')) return null;
  if (pairKey.includes('|')) {
    // legacy "vpc:<vport_id>|u:<user_id>"
    const left = pairKey.split('|')[0];
    return left.split(':')[1] || null;
  }
  // new "vpc:<vport_id>::<uidA>::<uidB>"
  const first = pairKey.split('::')[0];
  return first.split(':')[1] || null;
}

export default function VChatScreen() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const { identity } = useIdentity();                              // ✅ identity may already carry actorId/vportId

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState(null);

  const [conversationData, setConversationData] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);

  // ✅ resolved actor id for this VPORT (needed to send)
  const [senderActorId, setSenderActorId] = useState(identity?.actorId ?? null);
  const [resolvingActor, setResolvingActor] = useState(false);     // UX hint

  const bottomRef    = useRef(null);
  const headerRef    = useRef(null);
  const inputWrapRef = useRef(null);

  const [padTop, setPadTop] = useState(DEFAULT_HEADER_H);
  const [padBottom, setPadBottom] = useState(DEFAULT_INPUT_H);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  // ✅ Resolve VPORT actor id locally using conversation->pair_key->vport_id->actors.id (by vport_id)
  useEffect(() => {
    let cancelled = false;

    async function resolveActor() {
      if (!conversationId) return;
      // If identity already has an actorId, use it
      if (identity?.actorId) {
        setSenderActorId(identity.actorId);
        return;
      }
      setResolvingActor(true);
      setErrText(null);
      try {
        // 1) get pair_key
        const { data: conv, error: convErr } = await supabase
          .schema('vc')
          .from('conversations')
          .select('pair_key')
          .eq('id', conversationId)
          .maybeSingle();
        if (convErr) throw convErr;

        const vportId = extractVportIdFromPairKey(conv?.pair_key);
        if (!vportId) throw new Error('VPORT not found in conversation key');

        // 2) get vc.actors.id by vport_id + kind='vport'
        const { data: actor, error: actorErr } = await supabase
          .schema('vc')
          .from('actors')
          .select('id')
          .eq('vport_id', vportId)
          .eq('kind', 'vport')
          .maybeSingle();
        if (actorErr) throw actorErr;

        if (!actor?.id) throw new Error('No actor row for this VPORT');
        if (!cancelled) setSenderActorId(actor.id);
      } catch (e) {
        if (!cancelled) {
          setSenderActorId(null);
          setErrText(e?.message || 'Failed to resolve VPORT actor.');
        }
      } finally {
        if (!cancelled) setResolvingActor(false);
      }
    }

    // only resolve if we don't already have it
    if (!senderActorId) resolveActor();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, identity?.actorId]);

  // auto-measure header & input heights
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      setPadTop(headerRef.current?.offsetHeight ?? DEFAULT_HEADER_H);
      setPadBottom(inputWrapRef.current?.offsetHeight ?? DEFAULT_INPUT_H);
    });
    if (headerRef.current) ro.observe(headerRef.current);
    if (inputWrapRef.current) ro.observe(inputWrapRef.current);
    return () => ro.disconnect();
  }, []);

  // initial load (header + history) + mark read
  useEffect(() => {
    let cancelled = false;
    if (!conversationId || !user?.id) return;

    (async () => {
      setLoading(true);
      setErrText((prev) => prev); // keep any actor resolve message visible

      const headerP = vchat.getConversationHeader(conversationId).catch(() => null);
      const msgsP = vchat.listMessages(conversationId, { limit: 1000 });

      try {
        const [hdr, listRaw] = await Promise.all([headerP, msgsP]);
        if (cancelled) return;

        setConversationData(hdr || null);

        const cut = hdr?.cleared_before || null;
        const list = applyCut(listRaw || [], cut).sort(byCreatedAsc);

        setMessages(list);

        const latestAt = list.length ? list[list.length - 1].created_at : cut;
        setLastSeen(latestAt);

        try { await vchat.markConversationRead(conversationId); } catch {}
      } catch (e) {
        if (cancelled) return;
        setErrText(e?.message || 'Failed to load conversation.');
        setMessages([]);
        setConversationData(null);
        setLastSeen(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(() => scrollToBottom('auto'), 0);
        }
      }
    })();

    return () => {
      cancelled = true;
      setMessages([]);
      setConversationData(null);
      setLastSeen(null);
    };
  }, [conversationId, user?.id, scrollToBottom]);

  // catch-up on focus/visibility (no realtime) + mark read
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const fetchCatchUp = async () => {
      const cut = conversationData?.cleared_before || null;
      const since = lastSeen || cut;
      if (!since) return;

      try {
        let all = await vchat.listMessages(conversationId, { limit: 200 });
        all = applyCut(all || [], cut).sort(byCreatedAsc);
        const newer = all.filter(m => new Date(m.created_at) > new Date(since));
        if (!newer.length) {
          try { await vchat.markConversationRead(conversationId); } catch {}
          return;
        }

        setMessages(prev => {
          const merged = dedupeById([...prev, ...newer]).sort(byCreatedAsc);
          setLastSeen(merged[merged.length - 1].created_at);
          return merged;
        });

        setTimeout(() => scrollToBottom('smooth'), 0);
        try { await vchat.markConversationRead(conversationId); } catch {}
      } catch {
        // non-fatal
      }
    };

    const onVis = () => { if (!document.hidden) fetchCatchUp(); };
    window.addEventListener('focus', fetchCatchUp);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', fetchCatchUp);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [conversationId, user?.id, conversationData?.cleared_before, lastSeen, scrollToBottom]);

  const handleOptimisticSend = useCallback((payload) => {
    if (!user?.id || !conversationId) return;

    if (!senderActorId) {
      setErrText('Cannot send from VPORT: missing actor_id. (Resolving… try again in a moment)');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const temp = {
      id: tempId,
      conversation_id: conversationId,
      sender_user_id: user.id,      // for isMine heuristic
      actor_id: senderActorId,      // ✅ critical for VPORT messages
      content: payload.content ?? null,
      media_url: payload.media_url ?? null,
      media_type: payload.media_type ?? 'text',
      created_at: nowIso,
      _temp: true,
    };

    setMessages(prev => [...prev, temp].sort(byCreatedAsc));
    setTimeout(() => scrollToBottom('smooth'), 0);

    (async () => {
      try {
        const saved = await vchat.sendMessage(conversationId, {
          ...payload,
          actor_id: senderActorId,   // server side uses this anyway
          sender_id: senderActorId,  // harmless if ignored; required in some setups
        });

        setMessages(prev => {
          const replaced = prev.map(m => (m.id === tempId ? saved : m));
          return dedupeById(replaced).sort(byCreatedAsc);
        });
        setLastSeen(saved.created_at);
        try { await vchat.markConversationRead(conversationId); } catch {}
      } catch (e) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setErrText(e?.message || 'Failed to send message.');
      }
    })();
  }, [conversationId, user?.id, senderActorId, scrollToBottom]);

  if (!user) return null;

  return (
    <div className="h-[100dvh] bg-black overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed inset-x-0 top-0 z-40 bg-black/90 backdrop-blur border-b border-neutral-800">
        <div ref={headerRef} className="h-14 max-w-2xl mx-auto px-3 flex items-stretch">
          <ChatHeader conversationId={conversationId} />
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="h-full overflow-y-auto"
        style={{
          paddingTop: `calc(${padTop}px + env(safe-area-inset-top))`,
          paddingBottom: `calc(${padBottom}px + env(safe-area-inset-bottom))`,
        }}
      >
        {loading ? (
          <div className="max-w-3xl mx-auto px-3 pt-3 space-y-2">
            <div className="h-5 w-32 bg-neutral-900/50 rounded animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-neutral-900/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-3 pt-3 pb-4 space-y-1.5">
            {errText && (
              <div className="px-3 py-2 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded">
                {errText}
              </div>
            )}
            {messages.length === 0 && !errText && (
              <div className="px-3 py-6 text-center text-white/60 text-sm">
                No messages yet — say hi 👋
              </div>
            )}
            {messages.map(m => (
              <MessageItem key={m.id} message={m} currentUserId={user.id} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Fixed Input */}
      <div ref={inputWrapRef} className="fixed inset-x-0 bottom-0 z-50">
        <div className="max-w-2xl mx-auto px-3">
          <MessageInput
            conversationId={conversationId}
            onSend={handleOptimisticSend}
            className="!static"
            // If your MessageInput supports a disabled prop, uncomment:
            // disabled={!senderActorId || resolvingActor}
          />
          {!senderActorId && (
            <div className="mt-2 text-xs text-white/60">
              Resolving VPORT identity… (make sure this VPORT has an actor in <code>vc.actors</code> with <code>vport_id</code> set)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
