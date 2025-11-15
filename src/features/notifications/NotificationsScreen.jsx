// src/features/notifications/NotificationsScreen.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import NotificationItem from '@/features/notifications/notificationcenter/NotificationItem';
import { useIdentity } from '@/state/identityContext';

const PAGE_SIZE = 20;

function isTodayFast(d) {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function normTab(k, ctx) {
  const kind = (k || '').toLowerCase();
  if (kind.includes('rose')) return 'rose';
  if (kind.includes('dislike')) return 'dislike';
  if (kind.includes('like')) return 'like';
  const rt = String((ctx && ctx.reaction_type) || '').toLowerCase();
  return rt === 'like' || rt === 'dislike' || rt === 'rose' ? rt : 'rose';
}

function ensureContext(ctx) {
  if (!ctx) return {};
  if (typeof ctx === 'object') return ctx;
  try { return JSON.parse(ctx); } catch { return {}; }
}

/** get current human profile id (public.profiles.id == auth.user.id in your setup) */
async function getCurrentProfileId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

/** map human profile -> user-actor.id */
async function getMyActorId() {
  const meId = await getCurrentProfileId();
  if (!meId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', meId)
    .limit(1)
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

/** map vport -> vport-actor.id */
async function getVportActorId(vportId) {
  if (!vportId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('vport_id', vportId)
    .limit(1)
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

/** Build block sets (ACTOR-BASED) */
async function getBlockSetsByActor(myActorId) {
  if (!myActorId) return { iBlockedActors: new Set(), blockedMeActors: new Set() };
  try {
    const [{ data: myBlocks, error: e1 }, { data: blockedBy, error: e2 }] = await Promise.all([
      supabase.schema('vc').from('user_blocks').select('blocked_actor_id').eq('blocker_actor_id', myActorId),
      supabase.schema('vc').from('user_blocks').select('blocker_actor_id').eq('blocked_actor_id', myActorId),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    return {
      iBlockedActors: new Set((myBlocks ?? []).map(r => r.blocked_actor_id).filter(Boolean)),
      blockedMeActors: new Set((blockedBy ?? []).map(r => r.blocker_actor_id).filter(Boolean)),
    };
  } catch (err) {
    console.error('[Notifications] getBlockSetsByActor error:', err);
    return { iBlockedActors: new Set(), blockedMeActors: new Set() };
  }
}

/** Filter rows by block sets using sender's actor_id */
function filterByBlocks(rows, iBlockedActors, blockedMeActors) {
  if (!rows?.length) return [];
  return rows.filter(n => {
    // allow system/broadcast without a sender
    if (!n.actor_id) return true;
    if (iBlockedActors.has(n.actor_id)) return false;
    if (blockedMeActors.has(n.actor_id)) return false;
    return true;
  });
}

/** Resolve sender display info for a set of actor_ids */
async function resolveSenders(actorIds) {
  const unique = Array.from(new Set(actorIds.filter(Boolean)));
  if (unique.length === 0) return {};

  // 1) fetch actors
  const { data: actors, error: e1 } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, profile_id, vport_id')
    .in('id', unique);
  if (e1) throw e1;

  const profileIds = Array.from(new Set(actors.map(a => a.profile_id).filter(Boolean)));
  const vportIds = Array.from(new Set(actors.map(a => a.vport_id).filter(Boolean)));

  // 2) fetch profiles and vports
  const [profilesRes, vportsRes] = await Promise.all([
    profileIds.length
      ? supabase.from('profiles').select('id, display_name, username, photo_url').in('id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    vportIds.length
      ? supabase.schema('vc').from('vports').select('id, name, slug, avatar_url').in('id', vportIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (vportsRes.error) throw vportsRes.error;

  const profMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));
  const vportMap = new Map((vportsRes.data ?? []).map(v => [v.id, v]));

  // 3) build sender map
  const out = {};
  for (const a of actors) {
    const prof = a.profile_id ? profMap.get(a.profile_id) : null;
    const vp = a.vport_id ? vportMap.get(a.vport_id) : null;

    if (vp) {
      out[a.id] = {
        type: 'vport',
        id: vp.id,
        display_name: vp.name || 'VPORT',
        slug: vp.slug || undefined,
        avatar_url: vp.avatar_url || undefined,
        photo_url: vp.avatar_url || undefined,
      };
    } else if (prof) {
      out[a.id] = {
        type: 'user',
        id: prof.id,
        display_name: prof.display_name,
        username: prof.username || undefined,
        avatar_url: prof.photo_url || undefined,
        photo_url: prof.photo_url || undefined,
      };
    } else {
      out[a.id] = {
        type: 'actor',
        id: a.id,
        display_name: 'Someone',
      };
    }
  }
  return out;
}

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const identity = useIdentity?.() || null;
  const actingAsUser = !!identity?.isUser && !!identity?.userId;
  const actingAsVport = !!identity?.isVport && !!identity?.vportId;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [paging, setPaging] = useState(false);
  const [err, setErr] = useState('');

  const iBlockedRef = useRef(new Set());
  const blockedMeRef = useRef(new Set());
  const [blocksReady, setBlocksReady] = useState(false);

  const [myActorId, setMyActorId] = useState(null);
  const [targetActorId, setTargetActorId] = useState(null); // inbox actor for RLS (recipient_actor_id)

  // Resolve myActorId and targetActorId
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mine = await getMyActorId();
        if (!alive) return;
        setMyActorId(mine);

        if (actingAsVport && identity?.vportId) {
          const t = await getVportActorId(identity.vportId);
          if (!alive) return;
          setTargetActorId(t);
        } else {
          setTargetActorId(mine); // user inbox == self actor
        }
      } catch (e) {
        if (alive) {
          console.error('[Notifications] actor resolution error:', e);
          setMyActorId(null);
          setTargetActorId(null);
        }
      }
    })();
    return () => { alive = false; };
  }, [actingAsVport, identity?.vportId]);

  // Preload block lists (actor-based)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!myActorId) {
        setBlocksReady(true);
        return;
      }
      const { iBlockedActors, blockedMeActors } = await getBlockSetsByActor(myActorId);
      if (!active) return;
      iBlockedRef.current = iBlockedActors;
      blockedMeRef.current = blockedMeActors;
      setBlocksReady(true);
    })();
    return () => { active = false; };
  }, [myActorId]);

  // Fetch a page for CURRENT inbox using recipient_actor_id = targetActorId
  const fetchPage = useCallback(
    async ({ before } = {}) => {
      if (!targetActorId) return [];

      let q = supabase
        .schema('vc')
        .from('notifications')
        .select('id, recipient_actor_id, actor_id, kind, object_type, object_id, ref_type, ref_id, link_path, context, is_read, is_seen, created_at')
        .eq('recipient_actor_id', targetActorId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + (before ? 1 : 0));

      if (before) q = q.lt('created_at', before);

      const { data, error } = await q;
      if (error) {
        console.error('[notifs] fetch error', error);
        throw error;
      }

      const pageRaw = data ?? [];

      // Resolve sender info for actor_ids
      const senderMap = await resolveSenders(pageRaw.map(n => n.actor_id));
      const page = pageRaw.map(n => ({
        ...n,
        context: ensureContext(n.context),
        sender: n.actor_id ? senderMap[n.actor_id] || null : null,
      }));

      // actor-based block filter using sender's actor_id
      return filterByBlocks(page, iBlockedRef.current, blockedMeRef.current);
    },
    [targetActorId]
  );

  // initial load
  useEffect(() => {
    if (!blocksReady || !targetActorId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const page = await fetchPage();
        if (cancel) return;
        const trimmed = page.slice(0, PAGE_SIZE);
        setRows(trimmed);
        setHasMore(page.length > PAGE_SIZE);
        setCursor(trimmed[trimmed.length - 1]?.created_at || null);
        window.dispatchEvent(new Event('noti:refresh'));
      } catch (e) {
        if (!cancel) setErr(e?.message || 'Failed to load notifications.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [blocksReady, targetActorId, fetchPage]);

  // section split
  const { todayRows, earlierRows } = useMemo(() => {
    const t = [], e = [];
    for (const n of rows) (isTodayFast(new Date(n.created_at)) ? t : e).push(n);
    return { todayRows: t, earlierRows: e };
  }, [rows]);

  // mark single (respect RLS target via recipient_actor_id)
  const markAsRead = useCallback(async (id) => {
    if (!id || !targetActorId) return;
    try {
      const { error } = await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', id)
        .eq('recipient_actor_id', targetActorId);
      if (error) throw error;

      setRows(prev => prev.map(n => (n.id === id ? { ...n, is_read: true, is_seen: true } : n)));
      window.dispatchEvent(new Event('noti:refresh'));
    } catch (e) {
      console.error('[notifs] markAsRead error', e);
    }
  }, [targetActorId]);

  // mark all seen (drop RPC; do a scoped update)
  const markAllSeen = useCallback(async () => {
    if (!targetActorId) return;
    try {
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_seen: true, is_read: true })
        .eq('recipient_actor_id', targetActorId)
        .or('is_seen.is.false,is_read.is.false');
    } catch (e) {
      console.warn('[notifs] markAllSeen fallback err', e?.message || e);
    }

    try {
      const page = await fetchPage();
      const trimmed = page.slice(0, PAGE_SIZE);
      setRows(trimmed);
      setHasMore(page.length > PAGE_SIZE);
      setCursor(trimmed[trimmed.length - 1]?.created_at || null);
    } catch {
      setRows(prev => prev.map(n => ({ ...n, is_seen: true, is_read: true })));
    }
    window.dispatchEvent(new Event('noti:refresh'));
  }, [targetActorId, fetchPage]);

  // pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || paging || !cursor) return;
    setPaging(true);
    setErr('');
    try {
      const page = await fetchPage({ before: cursor });
      const trimmed = page.slice(0, PAGE_SIZE);
      setRows(prev => [...prev, ...trimmed]);
      setHasMore(page.length > PAGE_SIZE);
      setCursor(trimmed[trimmed.length - 1]?.created_at || null);
    } catch (e) {
      setErr(e?.message || 'Failed to load more.');
    } finally {
      setPaging(false);
    }
  }, [hasMore, paging, cursor, fetchPage]);

  // deep-link helpers (unchanged)
  const resolvePostId = useCallback(async (n) => {
    const ctx = ensureContext(n?.context);
    const objType = (n?.object_type || '').toLowerCase();

    const commentIdMaybe = ctx.comment_id || (objType === 'post_comment' ? n.object_id : null);
    if (commentIdMaybe) {
      const { data } = await supabase.schema('vc').from('post_comments').select('post_id').eq('id', commentIdMaybe).maybeSingle();
      if (data?.post_id) return data.post_id;
    }
    if (ctx.post_id) return ctx.post_id;
    if (objType === 'post' && n.object_id) return n.object_id;
    return null;
  }, []);

  const derivePath = useCallback(async (n) => {
    if (!n) return null;
    if (typeof n.link_path === 'string' && n.link_path.startsWith('/noti/post/')) {
      return n.link_path;
    }
    const kind = (n.kind || '').toLowerCase();
    const objType = (n.object_type || '').toLowerCase();
    const ctx = ensureContext(n.context);

    if (kind === 'comment_like' || objType === 'post_comment') {
      const commentId = ctx.comment_id || (objType === 'post_comment' ? n.object_id : null);
      const postId = ctx.post_id || (await resolvePostId(n));
      if (postId && commentId) return `/noti/post/${encodeURIComponent(postId)}?commentId=${encodeURIComponent(commentId)}`;
      if (postId) return `/noti/post/${encodeURIComponent(postId)}`;
    }

    if (kind.includes('like') || kind.includes('dislike') || kind.includes('rose') || kind === 'post_reaction') {
      const postId = ctx.post_id || (objType === 'post' ? n.object_id : null) || (await resolvePostId(n));
      if (postId) {
        const tab = normTab(kind, ctx);
        return `/noti/post/${encodeURIComponent(postId)}?tab=${encodeURIComponent(tab)}`;
      }
    }

    const postId = ensureContext(n?.context)?.post_id || (objType === 'post' ? n.object_id : null) || (await resolvePostId(n));
    if (postId) return `/noti/post/${encodeURIComponent(postId)}`;
    return null;
  }, [resolvePostId]);

  const handleOpen = useCallback(async (notif) => {
    await markAsRead(notif.id);
    let path = await derivePath(notif);
    if (!path) {
      const pid = ensureContext(notif?.context)?.post_id || (notif?.object_type === 'post' ? notif?.object_id : null);
      if (pid) path = `/noti/post/${encodeURIComponent(pid)}`;
    }
    navigate(path || '/notifications');
  }, [markAsRead, derivePath, navigate]);

  const handleResolved = useCallback((id) => {
    setRows(prev => prev.filter(n => n.id !== id));
    window.dispatchEvent(new Event('noti:refresh'));
  }, []);

  const unreadCount = useMemo(() => rows.filter(r => !r.is_seen).length, [rows]);
  const showLoading = loading || !blocksReady;
  const headingText = (actingAsVport ? 'VPort Notifications' : 'Notifications') + (unreadCount ? ` (${unreadCount})` : '');

  return (
    <div className="max-w-xl mx-auto px-4 py-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{headingText}</h1>
        <button
          onClick={markAllSeen}
          className="text-sm px-3 py-1 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-60"
          disabled={rows.length === 0}
        >
          Mark all seen
        </button>
      </div>

      {err ? <div className="mb-3 text-red-400 text-sm">{err}</div> : null}

      {showLoading ? (
        <div className="py-16 text-center text-neutral-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-neutral-500">No notifications yet</div>
      ) : (
        <>
          {(() => {
            const t = [], e = [];
            for (const n of rows) (isTodayFast(new Date(n.created_at)) ? t : e).push(n);
            return (
              <>
                {t.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-sm font-semibold text-neutral-400 mb-2">Today</h2>
                    <ul className="space-y-3">
                      {t.map(n => (
                        <NotificationItem key={n.id} notif={n} onClick={() => handleOpen(n)} onResolved={handleResolved} />
                      ))}
                    </ul>
                  </section>
                )}
                <section className="mb-4">
                  <h2 className="text-sm font-semibold text-neutral-400 mb-2">Past Notifications</h2>
                  {e.length === 0 ? (
                    <p className="text-neutral-500">No earlier notifications.</p>
                  ) : (
                    <ul className="space-y-3">
                      {e.map(n => (
                        <NotificationItem key={n.id} notif={n} onClick={() => handleOpen(n)} onResolved={handleResolved} />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            );
          })()}

          <div className="flex justify-center pb-6">
            {hasMore ? (
              <button
                onClick={loadMore}
                className="text-sm px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
                disabled={paging}
              >
                {paging ? 'Loading…' : 'See previous notifications'}
              </button>
            ) : (
              <div className="text-xs text-neutral-500">You’re all caught up.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
