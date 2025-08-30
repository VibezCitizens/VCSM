// src/features/chat/ChatScreen.jsx
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

export default function ChatScreen() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState(null);

  const [conversationData, setConversationData] = useState(null); // includes cleared_before
  const [lastSeen, setLastSeen] = useState(null); // ISO string

  const bottomRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  // initial load (header + history)
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
        setLastSeen(data.length ? data[data.length - 1].created_at : cut);
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

  // catch-up on focus/visibility (no realtime)
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
        if (!newer.length) return;

        setMessages(prev => {
          const merged = dedupeById([...prev, ...newer]).sort(byCreatedAsc);
          setLastSeen(merged[merged.length - 1].created_at);
          return merged;
        });

        setTimeout(() => scrollToBottom('smooth'), 0);
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

  // header patcher if you toggle mute/archive elsewhere
  const handleUpdateHeader = useCallback((patch) => {
    setConversationData(prev => ({ ...(prev || {}), ...(patch || {}) }));
  }, []);

  // optimistic send (no realtime)
  const handleOptimisticSend = useCallback((payload) => {
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: payload.content ?? null,
      media_url: payload.media_url ?? null,
      media_type: payload.media_type ?? null,
      created_at: new Date().toISOString(),
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
      } catch (e) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setErrText(e?.message || 'Failed to send message.');
      }
    })();
  }, [conversationId, user?.id, scrollToBottom]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full max-h-screen bg-black">
      <ChatHeader
        conversationId={conversationId}
        loading={loading}
        error={errText}
        conversationData={conversationData}
        onUpdateHeader={handleUpdateHeader}
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom))' }}
      >
        {loading ? (
          <div className="px-3 pt-3 space-y-2">
            <div className="h-5 w-32 bg-neutral-900/50 rounded animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-neutral-900/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="pt-3 pb-4 space-y-1.5">
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

      <MessageInput
        conversationId={conversationId}
        onSend={handleOptimisticSend}
      />
    </div>
  );
}
