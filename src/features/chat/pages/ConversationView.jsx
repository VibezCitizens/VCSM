// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\chat\pages\ConversationView.jsx
// VERSION: 2025-11-11.1 (respect history_cutoff_at on load/realtime/pagination)

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';

import ChatHeader from '../components/ChatHeader';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';

import { editMessage as apiEditMessage } from '../helpers/editmessage';
import { unsendMessage as apiUnsendMessage } from '../helpers/unsendmessage';
import {
  deleteForMe as apiDeleteForMe,
  getHiddenMessageIdSet as apiGetHiddenMessageIdSet,
} from '../helpers/deleteforme';

// ★ ADDED — your read-marking hook
import useMarkThreadAsRead from '@/features/chat/hooks/useMarkThreadAsRead';

const PAGE_SIZE = 30;
const REALTIME_CHANNEL_PREFIX = 'vc-convo-';
const BOTTOM_BAR_PX = 84;
const DEBUG_CHAT = true;

const byAscCreated = (a, b) => new Date(a.created_at) - new Date(b.created_at);
const isoLt = (isoA, isoB) => new Date(isoA).getTime() < new Date(isoB).getTime();

function uniqueById(list) {
  const seen = new Set();
  const out = [];
  for (const m of list) {
    const k = m.id ?? m.uuid ?? m._tempId;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(m);
  }
  return out;
}
function dbg(...args) {
  if (!DEBUG_CHAT) return;
  const ts = new Date().toISOString();
  console.log('[ConversationView]', ts, ...args);
}

export default function VConversationView({
  conversationId: conversationIdProp,
  initialPartner = null
}) {
  const params = useParams();
  const navigate = useNavigate();
  const { identity, isLoading: identityLoading } = useIdentity();

  const conversationIdParam = params?.conversationId ?? params?.id ?? null;
  const conversationId = conversationIdProp ?? conversationIdParam ?? null;

  const [partner, setPartner] = useState(initialPartner);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const typingChannelRef = useRef(null);

  const [editing, setEditing] = useState({ id: null, original: '' });
  const hiddenForMe = useRef(new Set());
  const oldestCursorRef = useRef({ created_at: null, id: null });

  const myActorId = identity?.actorId ?? null;

  const [historyCutoffAt, setHistoryCutoffAt] = useState(null);

  const authReadyRef = useRef(false);
  const [authTick, setAuthTick] = useState(0);

  async function ensureAuthReady(maxWaitMs = 5000) {
    if (authReadyRef.current) return true;
    const started = Date.now();
    while (Date.now() - started < maxWaitMs) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const userResp = await supabase.auth.getUser();
      const userId = userResp?.data?.user?.id;
      if (token && userId) {
        authReadyRef.current = true;
        return true;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_evt, session) => {
      authReadyRef.current = !!session?.access_token;
      setAuthTick(t => t + 1);
    });
    return () => sub.data?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    const onFocus = () => setAuthTick(t => t + 1);
    const onOnline = () => setAuthTick(t => t + 1);
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const ready = !!myActorId && !!conversationId && !identityLoading;

  const hydrateHiddenFor = useCallback(async (arr) => {
    if (!arr?.length) return;
    try {
      const ids = arr.map(m => m.id).filter(Boolean);
      const set = await apiGetHiddenMessageIdSet(supabase, { messageIds: ids });
      set.forEach(id => hiddenForMe.current.add(id));
      dbg('[hidden] hydrated subset', { count: set.size });
    } catch (e) {
      dbg('[hidden] hydrate failed (ignored)', e?.message || e);
    }
  }, []);

  // cutoff fetch
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    (async () => {
      if (!ready) return;
      const ok = await ensureAuthReady();
      if (!ok || !mounted) return;
      try {
        let q = supabase
          .schema('vc')
          .from('inbox_entries')
          .select('history_cutoff_at')
          .eq('actor_id', myActorId)
          .eq('conversation_id', conversationId)
          .single();
        if (typeof q.abortSignal === 'function') q.abortSignal(ac.signal);

        const { data, error } = await q;
        if (!mounted) return;

        if (error) {
          dbg('[cutoff] fetch error (ignored)', error);
          setHistoryCutoffAt(null);
        } else {
          setHistoryCutoffAt(data?.history_cutoff_at ?? null);
          dbg('[cutoff] set to', data?.history_cutoff_at ?? null);
        }
      } catch (e) {
        if (e?.name !== 'AbortError') dbg('[cutoff] fetch exception', e);
      }
    })();
    return () => { mounted = false; ac.abort(); };
  }, [ready, myActorId, conversationId, authTick]);

  // load latest page
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    (async () => {
      if (!ready || !conversationId) return;
      const ok = await ensureAuthReady();
      if (!ok || !mounted) return;

      try {
        let q = supabase
          .schema('vc')
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (historyCutoffAt) q = q.gte('created_at', historyCutoffAt);
        if (typeof q.abortSignal === 'function') q.abortSignal(ac.signal);

        const { data, error } = await q;
        if (error) throw error;

        const sorted = (data ?? []).sort(byAscCreated);
        const oldest = sorted[0];
        oldestCursorRef.current = oldest
          ? { created_at: oldest.created_at, id: oldest.id }
          : { created_at: null, id: null };

        await hydrateHiddenFor(sorted);
        if (!mounted) return;

        setMessages(sorted);

        const pageLen = (data ?? []).length;
        let more = pageLen === PAGE_SIZE;
        if (historyCutoffAt && oldest?.created_at && !isoLt(historyCutoffAt, oldest.created_at)) {
          more = false;
        }
        setHasMore(more);

        dbg('[loadLatest] loaded', sorted.length, 'messages');
      } catch (e) {
        if (e?.name !== 'AbortError') dbg('[loadLatest] error', e);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [conversationId, ready, authTick, hydrateHiddenFor, historyCutoffAt]);

  // realtime subscription
  useEffect(() => {
    let mounted = true;
    let ch;

    (async () => {
      if (!ready || !conversationId) return;
      const ok = await ensureAuthReady();
      if (!ok || !mounted) return;

      ch = supabase
        .channel(`vc-messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'vc',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const row = payload.new ?? payload.old;
            const rowCreatedAt = row?.created_at;

            if (historyCutoffAt && rowCreatedAt && isoLt(rowCreatedAt, historyCutoffAt)) {
              if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                setMessages(prev => prev.filter(m => m.id !== row.id));
              }
              return;
            }

            setMessages((prev) => {
              let next = prev.slice();
              if (payload.eventType === 'INSERT') {
                if (!payload.new.deleted_at) {
                  if (!hiddenForMe.current.has(payload.new.id)) {
                    next = uniqueById([...next, payload.new]).sort(byAscCreated);
                  }
                }
              } else if (payload.eventType === 'UPDATE') {
                const updated = payload.new;
                if (updated.deleted_at) {
                  next = next.filter((m) => m.id !== updated.id);
                } else {
                  next = next
                    .map((m) => (m.id === updated.id ? updated : m))
                    .sort(byAscCreated);
                }
              } else if (payload.eventType === 'DELETE') {
                next = next.filter((m) => m.id !== payload.old.id);
              }
              return next;
            });
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (ch) supabase.removeChannel(ch);
    };
  }, [conversationId, ready, authTick, historyCutoffAt]);

  // typing indicator
  useEffect(() => {
    let ch;
    (async () => {
      if (!ready || !conversationId) return;
      const ok = await ensureAuthReady();
      if (!ok) return;

      ch = supabase.channel(
        `${REALTIME_CHANNEL_PREFIX}${conversationId}`,
        { config: { broadcast: { self: false } } }
      );

      ch.on('broadcast', { event: 'typing' }, (evt) => {
        const from = evt?.payload?.actorId;
        if (!from || from === myActorId) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsTyping(true);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
      });

      ch.subscribe();
      typingChannelRef.current = ch;
    })();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [conversationId, ready, authTick, myActorId]);

  const sendTypingPing = useCallback(() => {
    const ch = typingChannelRef.current;
    if (!ch) return;
    ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: { actorId: myActorId, at: Date.now() },
    });
  }, [myActorId]);

  // pagination
  const loadOlder = useCallback(async () => {
    if (!conversationId) return;
    if (!oldestCursorRef.current.created_at) return;
    const ok = await ensureAuthReady();
    if (!ok) return;

    if (historyCutoffAt && !isoLt(historyCutoffAt, oldestCursorRef.current.created_at)) {
      setHasMore(false);
      return;
    }

    const ac = new AbortController();
    setLoadingOlder(true);
    try {
      const { created_at } = oldestCursorRef.current;

      let q = supabase
        .schema('vc')
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .lt('created_at', created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (historyCutoffAt) q = q.gte('created_at', historyCutoffAt);
      if (typeof q.abortSignal === 'function') q.abortSignal(ac.signal);

      const { data, error } = await q;
      if (error) throw error;

      const page = (data ?? []).sort(byAscCreated);

      await hydrateHiddenFor(page);

      setMessages((prev) => uniqueById([...page, ...prev]).sort(byAscCreated));

      const oldest = page[0];
      if (oldest) {
        oldestCursorRef.current = {
          created_at: oldest.created_at,
          id: oldest.id
        };
      }

      let more = (data ?? []).length === PAGE_SIZE;
      if (historyCutoffAt && oldest?.created_at && !isoLt(historyCutoffAt, oldest.created_at)) {
        more = false;
      }
      setHasMore(more);
    } catch (e) {
      if (e?.name !== 'AbortError') dbg('[loadOlder] error', e);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hydrateHiddenFor, historyCutoffAt]);

  // send message
  const sendMessage = useCallback(
    async (text) => {
      if (!conversationId || !myActorId) return;
      const ok = await ensureAuthReady();
      if (!ok) return;

      setIsSending(true);

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const nowIso = new Date().toISOString();
      const optimistic = {
        id: tempId,
        _tempId: tempId,
        _optimistic: true,
        conversation_id: conversationId,
        sender_actor_id: myActorId,
        body: text,
        created_at: nowIso,
      };
      setMessages((prev) => uniqueById([...prev, optimistic]).sort(byAscCreated));

      try {
        const { data, error } = await supabase
          .schema('vc')
          .from('messages')
          .insert([{ conversation_id: conversationId, sender_actor_id: myActorId, body: text }])
          .select('*')
          .single();

        if (error) throw error;

        setMessages((prev) =>
          prev
            .map((m) => (m._tempId === tempId ? data : m))
            .filter(Boolean)
            .sort(byAscCreated)
        );
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m._tempId !== tempId));
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, myActorId]
  );

  // edit
  const beginEdit = useCallback((id) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    setEditing({ id, original: msg.body || '' });
  }, [messages]);

  const saveEdit = useCallback(async (newText) => {
    if (!editing.id) return;
    try {
      const ok = await ensureAuthReady();
      if (!ok) return;
      await apiEditMessage(supabase, {
        messageId: editing.id,
        actorId: myActorId,
        newBody: newText,
      });
      setMessages(prev =>
        prev.map(m => m.id === editing.id
          ? { ...m, body: newText, edited_at: new Date().toISOString() }
          : m
        )
      );
      setEditing({ id: null, original: '' });
    } catch (e) {
      dbg('[edit] failed', e);
    }
  }, [editing.id, myActorId]);

  const cancelEdit = useCallback(() => {
    setEditing({ id: null, original: '' });
  }, []);

  const visibleMessages = useMemo(
    () => messages.filter((m) => !hiddenForMe.current.has(m.id)),
    [messages]
  );

  // ★ ADDED — CALL HOOK HERE
  useMarkThreadAsRead({
    conversationId,
    myActorId,
    messages: visibleMessages,
    ready,
  });

  if (!conversationId) {
    return (
      <div className="h-screen flex items-center justify-center text-white/70 bg-black">
        Missing conversationId
      </div>
    );
  }

  return (
    <div className="bg-black text-white flex flex-col min-h-0" style={{ height: '100dvh' }}>
      <ChatHeader
        partner={partner}
        conversationId={conversationId}
        myActorId={myActorId}
        onBack={() => navigate(-1)}
        onMenu={(action) => {
          if (action === 'report') {
            try {
              window.dispatchEvent(new CustomEvent('vc-open-report', {
                detail: { conversationId, ts: Date.now() },
              }));
            } catch {}
          }
        }}
      />

      <div className="flex-1 min-h-0">
        <div
          className="h-full relative flex flex-col"
          style={{ paddingBottom: `calc(${BOTTOM_BAR_PX}px + env(safe-area-inset-bottom))` }}
        >
          <ChatMessageList
            messages={visibleMessages}
            currentUserId={null}
            selfActorId={myActorId}
            onDeleteForMe={(id) => {
              hiddenForMe.current.add(id);
              setMessages((prev) => prev.filter((m) => !hiddenForMe.current.has(m.id)));
              (async () => {
                try {
                  const ok = await ensureAuthReady();
                  if (!ok) return;
                  await apiDeleteForMe(supabase, id);
                } catch (e) { dbg('[deleteForMe] rpc failed', e); }
              })();
            }}
            onUnsend={async (id) => {
              setMessages((prev) => prev.filter((m) => m.id !== id));

              try {
                const ok = await ensureAuthReady();
                if (!ok) return;

                const resp = await apiUnsendMessage(supabase, {
                  messageId: id,
                  actorId: myActorId,
                });

                if (!resp?.ok) {
                  return;
                }
              } catch (e) {
                dbg('[unsend] failed', e);
              }
            }}
            onEdit={(id) => beginEdit(id)}
            onLoadOlder={hasMore ? loadOlder : undefined}
            hasMore={hasMore}
            loadingOlder={loadingOlder}
          />

          <TypingIndicator isTyping={isTyping} offsetPx={BOTTOM_BAR_PX} />
        </div>
      </div>

      <ChatInput
        onSend={(text) => {
          sendTypingPing();
          sendMessage(text);
        }}
        onAttach={(files) => {
          try {
            window.dispatchEvent(
              new CustomEvent('vc-chat-attach', {
                detail: { conversationId, files: files ? Array.from(files) : null },
              })
            );
          } catch {}
        }}
        disabled={!ready}
        isSending={isSending}
        editing={!!editing.id}
        initialValue={editing.original}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
      />
    </div>
  );
}
