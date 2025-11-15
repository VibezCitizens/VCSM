// VERSION: 2025-11-11.1 (vport parallel) — auth-gated; abortable; mark-as-read; realtime dedupe; respects history_cutoff_at

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';
import ChatHeader from '../components/ChatHeader';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';
import useMarkThreadAsRead from '@/features/chat/hooks/useMarkThreadAsRead';

import { editMessage as apiEditMessage } from '../helpers/editmessage';
import { unsendMessage as apiUnsendMessage } from '../helpers/unsendmessage';
import { deleteForMe as apiDeleteForMe, getHiddenMessageIdSet as apiGetHiddenMessageIdSet } from '../helpers/deleteforme';

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
function dbg(...args){ if(!DEBUG_CHAT) return; console.log('[VportConversationView]', new Date().toISOString(), ...args); }

// Try to swap optimistic with real row if realtime INSERT arrived first
function swapOptimisticWithReal(prev, realRow, myActorId) {
  if (!myActorId || realRow.sender_actor_id !== myActorId) return null;
  const realTs = new Date(realRow.created_at).getTime();
  const windowMs = 15_000;
  let foundIndex = -1;
  for (let i = prev.length - 1; i >= 0; i--) {
    const m = prev[i];
    if (!m?._optimistic) continue;
    if (m.body !== realRow.body) continue;
    const mt = new Date(m.created_at).getTime();
    if (Math.abs(realTs - mt) <= windowMs) { foundIndex = i; break; }
  }
  if (foundIndex >= 0) {
    const next = prev.slice();
    next[foundIndex] = realRow;
    return next.sort(byAscCreated);
  }
  return null;
}

export default function VportConversationView({ conversationId: conversationIdProp, initialPartner = null }) {
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

  // iOS-style edit in the input
  const [editing, setEditing] = useState({ id: null, original: '' });

  const hiddenForMe = useRef(new Set());
  const oldestCursorRef = useRef({ created_at: null, id: null });

  // Works for vport because the active actor in identity is the vport actor_id
  const myActorId = identity?.actorId ?? null;
  const partnerActorId = partner?.actor_id ?? partner?.id ?? null;

  // Per-actor cutoff
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
      if (token && userId) { authReadyRef.current = true; return true; }
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
    const onTick = () => setAuthTick(t => t + 1);
    window.addEventListener('visibilitychange', onTick);
    window.addEventListener('focus', onTick);
    window.addEventListener('online', onTick);
    return () => {
      window.removeEventListener('visibilitychange', onTick);
      window.removeEventListener('focus', onTick);
      window.removeEventListener('online', onTick);
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
    } catch (e) { dbg('[hidden] hydrate failed (ignored)', e?.message || e); }
  }, []);

  // Fetch my inbox row to get history_cutoff_at
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
      } catch (e) { if (e?.name !== 'AbortError') dbg('[cutoff] fetch exception', e); }
    })();
    return () => { mounted = false; ac.abort(); };
  }, [ready, myActorId, conversationId, authTick]);

  // Initial page (respect cutoff)
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    (async () => {
      if (!ready || !conversationId) return;
      const ok = await ensureAuthReady();
      if (!ok || !mounted) return;
      try {
        let q = supabase.schema('vc').from('messages')
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
        oldestCursorRef.current = oldest ? { created_at: oldest.created_at, id: oldest.id } : { created_at: null, id: null };
        await hydrateHiddenFor(sorted);
        if (!mounted) return;
        setMessages(sorted);

        const pageLen = (data ?? []).length;
        let more = pageLen === PAGE_SIZE;
        if (historyCutoffAt && oldest?.created_at && !isoLt(historyCutoffAt, oldest.created_at)) {
          more = false;
        }
        setHasMore(more);

        dbg('[loadLatest] loaded', sorted.length, '(cutoff=', historyCutoffAt, ')');
      } catch (e) { if (e?.name !== 'AbortError') dbg('[loadLatest] error', e); }
    })();
    return () => { mounted = false; ac.abort(); };
  }, [conversationId, ready, authTick, hydrateHiddenFor, historyCutoffAt]);

  // Realtime (respect cutoff on INSERT/UPDATE/DELETE)
  useEffect(() => {
    let ch;
    (async () => {
      if (!ready || !conversationId) return;
      const ok = await ensureAuthReady();
      if (!ok) return;
      ch = supabase
        .channel(`vc-messages-${conversationId}`)
        .on('postgres_changes',
          { event: '*', schema: 'vc', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const row = payload.new ?? payload.old;
            const rowCreatedAt = row?.created_at;
            if (historyCutoffAt && rowCreatedAt && isoLt(rowCreatedAt, historyCutoffAt)) {
              if (payload.eventType !== 'INSERT') {
                setMessages(prev => prev.filter(m => m.id !== row.id));
              }
              return;
            }

            setMessages(prev => {
              let next = prev.slice();
              if (payload.eventType === 'INSERT') {
                if (!payload.new.deleted_at && !hiddenForMe.current.has(payload.new.id)) {
                  const swapped = swapOptimisticWithReal(prev, payload.new, myActorId);
                  if (swapped) return swapped;
                  next = uniqueById([...next, payload.new]).sort(byAscCreated);
                }
              } else if (payload.eventType === 'UPDATE') {
                const u = payload.new;
                if (u.deleted_at) next = next.filter(m => m.id !== u.id);
                else next = next.map(m => (m.id === u.id ? u : m)).sort(byAscCreated);
              } else if (payload.eventType === 'DELETE') {
                next = next.filter(m => m.id !== payload.old.id);
              }
              return next;
            });
          }
        )
        .subscribe((status) => dbg('[realtime] subscribe', status));
    })();
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [conversationId, ready, authTick, historyCutoffAt, myActorId]);

  // Typing (ignore self; optionally filter by partner)
  useEffect(() => {
    let ch;
    (async () => {
      if (!ready || !conversationId) return;
      const ok = await ensureAuthReady();
      if (!ok) return;
      ch = supabase.channel(`${REALTIME_CHANNEL_PREFIX}${conversationId}`, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'typing' }, (evt) => {
        const fromActor = evt?.payload?.actorId ?? null;
        if (fromActor && partnerActorId && fromActor !== partnerActorId) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsTyping(true);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
      });
      ch.subscribe((status) => dbg('[typing] subscribe', status));
      typingChannelRef.current = ch;
    })();
    return () => {
      if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
      if (typingChannelRef.current) { supabase.removeChannel(typingChannelRef.current); typingChannelRef.current = null; }
    };
  }, [conversationId, ready, authTick, partnerActorId]);

  const sendTypingPing = useCallback(() => {
    const ch = typingChannelRef.current; if (!ch) return;
    try { ch.send({ type: 'broadcast', event: 'typing', payload: { at: Date.now(), actorId: myActorId } }); }
    catch (e) { dbg('[typing] send failed', e); }
  }, [myActorId]);

  // Pagination (older) — stop at cutoff
  const loadOlder = useCallback(async () => {
    if (!conversationId) return;
    if (!oldestCursorRef.current.created_at) return;
    const ok = await ensureAuthReady(); if (!ok) return;

    if (historyCutoffAt && !isoLt(historyCutoffAt, oldestCursorRef.current.created_at)) {
      setHasMore(false);
      return;
    }

    const ac = new AbortController();
    setLoadingOlder(true);
    try {
      const { created_at, id } = oldestCursorRef.current;
      let q = supabase.schema('vc').from('messages')
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
      setMessages(prev => uniqueById([...page, ...prev]).sort(byAscCreated));
      const oldest = page[0];
      oldestCursorRef.current = oldest ? { created_at: oldest.created_at, id: oldest.id } : { created_at, id };

      let more = (data ?? []).length === PAGE_SIZE;
      if (historyCutoffAt && oldest?.created_at && !isoLt(historyCutoffAt, oldest.created_at)) {
        more = false;
      }
      setHasMore(more);
      dbg('[loadOlder] page', page.length, '(cutoff=', historyCutoffAt, ')');
    } catch (e) { if (e?.name !== 'AbortError') dbg('[loadOlder] error', e); }
    finally { setLoadingOlder(false); }
  }, [conversationId, hydrateHiddenFor, historyCutoffAt]);

  // Send message (optimistic -> server replace)
  const sendMessage = useCallback(async (text) => {
    if (!conversationId || !myActorId) { dbg('[send] blocked', { conversationId, myActorId }); return; }
    const ok = await ensureAuthReady(); if (!ok) return;
    setIsSending(true);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: tempId, _tempId: tempId, _optimistic: true,
      conversation_id: conversationId, sender_actor_id: myActorId, body: text, created_at: new Date().toISOString()
    };
    setMessages(prev => uniqueById([...prev, optimistic]).sort(byAscCreated));
    try {
      const { data, error } = await supabase.schema('vc').from('messages')
        .insert([{ conversation_id: conversationId, sender_actor_id: myActorId, body: text }])
        .select('*').single();
      if (error) throw error;
      setMessages(prev => prev.map(m => (m._tempId === tempId ? data : m)).filter(Boolean).sort(byAscCreated));
    } catch (e) {
      setMessages(prev => prev.filter(m => m._tempId !== tempId));
      dbg('[send] insert failed', e);
    } finally { setIsSending(false); }
  }, [conversationId, myActorId]);

  // Edit flow
  const beginEdit = useCallback((id) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    setEditing({ id, original: msg.body || '' });
  }, [messages]);

  const saveEdit = useCallback(async (newText) => {
    if (!editing.id) return;
    try {
      const ok = await ensureAuthReady(); if (!ok) return;
      await apiEditMessage(supabase, { messageId: editing.id, actorId: myActorId, newBody: newText });
      setMessages(prev => prev.map(m => m.id === editing.id ? { ...m, body: newText, edited_at: new Date().toISOString() } : m));
      setEditing({ id: null, original: '' });
    } catch (e) { dbg('[edit] failed]', e?.message || e); }
  }, [editing.id, myActorId]);

  const cancelEdit = useCallback(() => setEditing({ id: null, original: '' }), []);

  const visibleMessages = useMemo(
    () => messages.filter(m => !hiddenForMe.current.has(m.id)),
    [messages],
  );

  // Mark-as-read (send last id) via shared hook
  useMarkThreadAsRead({ conversationId, myActorId, messages, ready });

  const handleHeaderMenu = useCallback((action) => {
    if (action === 'report') {
      try { window.dispatchEvent(new CustomEvent('vc-open-report', { detail: { conversationId, ts: Date.now() } })); } catch {}
    }
  }, [conversationId]);

  if (!conversationId) {
    return <div className="h-screen flex items-center justify-center text-white/70 bg-black">Missing conversationId</div>;
  }

  return (
    <div className="bg-black text-white flex flex-col min-h-0" style={{ height: '100dvh' }}>
      <ChatHeader
        partner={partner}
        conversationId={conversationId}
        myActorId={myActorId}
        onBack={() => navigate(-1)}
        onMenu={handleHeaderMenu}
      />
      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col" style={{ paddingBottom: `calc(${BOTTOM_BAR_PX}px + env(safe-area-inset-bottom))` }}>
          <ChatMessageList
            messages={visibleMessages}
            currentUserId={null}
            selfActorId={myActorId}
            onDeleteForMe={async (id) => {
              hiddenForMe.current.add(id);
              setMessages(prev => prev.filter(m => !hiddenForMe.current.has(m.id)));
              try { const ok = await ensureAuthReady(); if (!ok) return; await apiDeleteForMe(supabase, id); } catch (e) { dbg('[deleteForMe] rpc failed', e?.message || e); }
            }}
            onUnsend={async (id) => {
              const prevSnapshot = messages;
              setMessages(prev => prev.filter(m => m.id !== id));
              try {
                const ok = await ensureAuthReady(); if (!ok) { setMessages(prevSnapshot); return; }
                await apiUnsendMessage(supabase, { messageId: id, actorId: myActorId });
              } catch (e) {
                dbg('[unsend] failed', e);
                setMessages(prevSnapshot);
              }
            }}
            onEdit={(id) => beginEdit(id)}
            onLoadOlder={hasMore ? loadOlder : undefined}
            hasMore={hasMore}
            loadingOlder={loadingOlder}
          />
          <TypingIndicator isTyping={isTyping} />
        </div>
      </div>

      <ChatInput
        // no typing ping on send, to avoid local flash
        onSend={(text) => { sendMessage(text); }}
        onAttach={(files) => {
          try { window.dispatchEvent(new CustomEvent('vc-chat-attach', { detail: { conversationId, files: files ? Array.from(files) : null } })); } catch {}
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
