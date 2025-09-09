import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/features/chat/components/ChatHeader';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { chat } from '@/data/chat';

// helpers
const byCreatedAsc = (a, b) => new Date(a.created_at) - new Date(b.created_at);
const dedupeById = (arr) => {
  const m = new Map();
  for (const x of arr) m.set(x.id, x);
  return [...m.values()];
};
const applyCut = (arr, cut) =>
  cut ? arr.filter(m => new Date(m.created_at) > new Date(cut)) : arr;

// sensible defaults; we’ll auto-measure anyway
const DEFAULT_HEADER_H = 56;
const DEFAULT_INPUT_H  = 84;

export default function ChatScreen() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState(null);

  const [conversationData, setConversationData] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);

  const bottomRef  = useRef(null);
  const headerRef  = useRef(null);
  const inputWrapRef = useRef(null);

  const [padTop, setPadTop] = useState(DEFAULT_HEADER_H);
  const [padBottom, setPadBottom] = useState(DEFAULT_INPUT_H);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  // auto-measure header & input heights so the scroll area never overlaps them
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      setPadTop(headerRef.current?.offsetHeight ?? DEFAULT_HEADER_H);
      setPadBottom(inputWrapRef.current?.offsetHeight ?? DEFAULT_INPUT_H);
    });
    if (headerRef.current) ro.observe(headerRef.current);
    if (inputWrapRef.current) ro.observe(inputWrapRef.current);
    return () => ro.disconnect();
  }, []);

  // initial load (header + history) + STAMP last_read_at
  useEffect(() => {
    let cancelled = false;
    if (!conversationId || !user?.id) return;

    (async () => {
      setLoading(true);
      setErrText(null);
      try {
        const hdr = await chat.getConversationHeader(conversationId);
        if (cancelled) return;
        setConversationData(hdr);

        const cut = hdr.cleared_before || null;
        let data = await chat.listMessages(conversationId, { limit: 1000 });
        data = applyCut(data || [], cut).sort(byCreatedAsc);

        if (cancelled) return;
        setMessages(data);
        const latestAt = data.length ? data[data.length - 1].created_at : cut;
        setLastSeen(latestAt);

        // <<< stamp as read so unread badge clears >>>
        try { await chat.markConversationRead(conversationId); } catch {}
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

  // catch-up on focus/visibility (no realtime) + STAMP last_read_at
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const fetchCatchUp = async () => {
      const cut = conversationData?.cleared_before || null;
      const since = lastSeen || cut;
      if (!since) return;

      try {
        let all = await chat.listMessages(conversationId, { limit: 200 });
        all = applyCut(all || [], cut).sort(byCreatedAsc);
        const newer = all.filter(m => new Date(m.created_at) > new Date(since));
        if (!newer.length) {
          // still stamp read on refocus, so badge clears even if you had unread==0 locally
          try { await chat.markConversationRead(conversationId); } catch {}
          return;
        }

        setMessages(prev => {
          const merged = dedupeById([...prev, ...newer]).sort(byCreatedAsc);
          setLastSeen(merged[merged.length - 1].created_at);
          return merged;
        });

        setTimeout(() => scrollToBottom('smooth'), 0);

        // <<< re-stamp as read after consuming new messages >>>
        try { await chat.markConversationRead(conversationId); } catch {}
      } catch {
        // best-effort
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

  const handleUpdateHeader = useCallback((patch) => {
    setConversationData(prev => ({ ...(prev || {}), ...(patch || {}) }));
  }, []);

  // optimistic send (no realtime)
  const handleOptimisticSend = useCallback((payload) => {
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const temp = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_user_id: user.id,
      actor_id: user.actor_id || null,
      content: payload.content ?? null,
      media_url: payload.media_url ?? null,
      media_type: payload.media_type ?? null,
      created_at: nowIso,
      _temp: true,
    };

    setMessages(prev => [...prev, temp].sort(byCreatedAsc));
    setTimeout(() => scrollToBottom('smooth'), 0);

    (async () => {
      try {
        const saved = await chat.sendMessage(conversationId, payload);
        setMessages(prev => {
          const replaced = prev.map(m => (m.id === tempId ? saved : m));
          return dedupeById(replaced).sort(byCreatedAsc);
        });
        setLastSeen(saved.created_at);

        // sending implies I’ve seen the latest → stamp read
        try { await chat.markConversationRead(conversationId); } catch {}
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    })();
  }, [conversationId, user?.id, scrollToBottom]);

  if (!user) return null;

  return (
    // lock viewport and prevent body scroll; only the messages list scrolls
    <div className="h-[100dvh] bg-black overflow-hidden">

      {/* FIXED, CENTERED TOP BAR (matches pic #2) */}
      <div className="fixed inset-x-0 top-0 z-40 bg-black/90 backdrop-blur border-b border-neutral-800">
        <div
          ref={headerRef}
          className="h-14 max-w-2xl mx-auto px-3 flex items-stretch"
        >
          <ChatHeader
            conversationId={conversationId}
            loading={loading}
            error={errText}
            conversationData={conversationData}
            onUpdateHeader={handleUpdateHeader}
          />
        </div>
      </div>

      {/* SCROLLABLE MESSAGES AREA (centered to same column) */}
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
            {messages.map(m => (
              <MessageItem key={m.id} message={m} currentUserId={user.id} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* FIXED, CENTERED BOTTOM INPUT (wrapper measured for padding) */}
      <div ref={inputWrapRef} className="fixed inset-x-0 bottom-0 z-50">
        <div className="max-w-2xl mx-auto px-3">
          {/* neutralize internal sticky by forcing static; wrapper is fixed */}
          <MessageInput
            conversationId={conversationId}
            onSend={handleOptimisticSend}
            className="!static"
          />
        </div>
      </div>
    </div>
  );
}
