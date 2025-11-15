// src/features/notifications/vnotificationcenter/VportNotificationsScreen.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';
import VportNotificationItem from './VportNotificationItem';

const PAGE_SIZE = 20;

/** Safer "is today" check that respects local timezone. */
function isTodayLocal(d) {
  try {
    const a = new Date(d);
    const today = new Date();
    return a.toLocaleDateString() === today.toLocaleDateString();
  } catch {
    return false;
  }
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
  if (typeof ctx === 'string') {
    try { return JSON.parse(ctx); } catch { return {}; }
  }
  return {};
}

/** Look up the actor.id for a given vport_id (needed for recipient_actor_id RLS) */
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

/** Resolve senders for a list of actor_ids → { [actor_id]: senderObj } */
async function resolveSenders(actorIds) {
  const unique = Array.from(new Set((actorIds || []).filter(Boolean)));
  if (unique.length === 0) return {};

  const { data: actors, error: e1 } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, profile_id, vport_id')
    .in('id', unique);

  if (e1) throw e1;

  const profileIds = Array.from(new Set(actors.map(a => a.profile_id).filter(Boolean)));
  const vportIds   = Array.from(new Set(actors.map(a => a.vport_id).filter(Boolean)));

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

  const out = {};
  for (const a of actors) {
    const prof = a.profile_id ? profMap.get(a.profile_id) : null;
    const vp   = a.vport_id ? vportMap.get(a.vport_id) : null;

    if (vp) {
      out[a.id] = {
        type: 'vport',
        id: vp.id,
        display_name: vp.name || 'VPORT',
        slug: vp.slug || null,
        avatar_url: vp.avatar_url || '/avatar.jpg',
        photo_url: vp.avatar_url || '/avatar.jpg',
      };
    } else if (prof) {
      out[a.id] = {
        type: 'user',
        id: prof.id,
        display_name: prof.display_name,
        username: prof.username || null,
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

export default function VportNotificationsScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  // Require active VPORT
  const vportId = identity?.type === 'vport' ? String(identity?.vportId || '') : null;

  const [vportActorId, setVportActorId] = useState(null); // <-- used for recipient_actor_id
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cursor, setCursor] = useState(null); // Date cursor (created_at)
  const [hasMore, setHasMore] = useState(true);
  const [paging, setPaging] = useState(false);
  const [err, setErr] = useState('');

  // Resolve VPORT actor id once identity is present
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!vportId) { setVportActorId(null); return; }
      try {
        const aid = await getVportActorId(vportId);
        if (!alive) return;
        setVportActorId(aid);
      } catch (e) {
        if (alive) {
          console.error('[VportNotifs] resolve vport actor error:', e);
          setVportActorId(null);
        }
      }
    })();
    return () => { alive = false; };
  }, [vportId]);

  // fetch a page (VPORT inbox) — keyset on created_at DESC
  const fetchPage = useCallback(
    async ({ before } = {}) => {
      if (!vportId || !vportActorId) return [];

      let q = supabase
        .schema('vc')
        .from('notifications')
        .select('id, recipient_actor_id, actor_id, kind, object_type, object_id, link_path, context, is_read, is_seen, created_at')
        .eq('recipient_actor_id', vportActorId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + (before ? 1 : 0));

      if (before) q = q.lt('created_at', before);

      const { data, error } = await q;
      if (error) throw error;

      const base = data ?? [];

      // enrich with sender
      const senderMap = await resolveSenders(base.map(n => n.actor_id));
      const page = base.map(n => ({
        ...n,
        context: ensureContext(n.context),
        sender: n.actor_id ? senderMap[n.actor_id] || null : null,
      }));

      return page;
    },
    [vportId, vportActorId]
  );

  // initial load
  useEffect(() => {
    if (!vportId || !vportActorId) return;
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
  }, [vportId, vportActorId, fetchPage]);

  // section split
  const { todayRows, earlierRows } = useMemo(() => {
    const t = [], e = [];
    for (const n of rows) (isTodayLocal(n.created_at) ? t : e).push(n);
    return { todayRows: t, earlierRows: e };
  }, [rows]);

  // mark single (owner can update their own rows under RLS)
  const markAsRead = useCallback(async (id) => {
    if (!id || !vportActorId) return;
    try {
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', id)
        .eq('recipient_actor_id', vportActorId); // <-- align with RLS
      setRows((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, is_seen: true } : n))
      );
      window.dispatchEvent(new Event('noti:refresh'));
    } catch {
      // ignore
    }
  }, [vportActorId]);

  // mark all seen (VPORT inbox via recipient_actor_id)
  const markAllSeen = useCallback(async () => {
    if (!vportActorId) return;
    try {
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_seen: true })
        .eq('recipient_actor_id', vportActorId)
        .eq('is_seen', false);
    } catch {
      // best-effort; ignore
    }

    try {
      const page = await fetchPage();
      const trimmed = page.slice(0, PAGE_SIZE);
      setRows(trimmed);
      setHasMore(page.length > PAGE_SIZE);
      setCursor(trimmed[trimmed.length - 1]?.created_at || null);
    } catch {
      setRows((prev) => prev.map((n) => ({ ...n, is_seen: true })));
    }
    window.dispatchEvent(new Event('noti:refresh'));
  }, [fetchPage, vportActorId]);

  // pagination (created_at keyset)
  const loadMore = useCallback(async () => {
    if (!vportId || !vportActorId || !hasMore || paging || !cursor) return;
    setPaging(true);
    setErr('');
    try {
      const page = await fetchPage({ before: cursor });
      const trimmed = page.slice(0, PAGE_SIZE);
      setRows((prev) => [...prev, ...trimmed]);
      setHasMore(page.length > PAGE_SIZE);
      setCursor(trimmed[trimmed.length - 1]?.created_at || null);
    } catch (e) {
      setErr(e?.message || 'Failed to load more.');
    } finally {
      setPaging(false);
    }
  }, [vportId, vportActorId, hasMore, paging, cursor, fetchPage]);

  // resolve post id for deep-linking (same logic)
  const resolvePostId = useCallback(async (n) => {
    const ctx = ensureContext(n?.context);
    const objType = (n?.object_type || '').toLowerCase();

    const commentIdMaybe =
      ctx.comment_id || (objType === 'post_comment' ? n.object_id : null);
    if (commentIdMaybe) {
      const { data } = await supabase
        .schema('vc')
        .from('post_comments')
        .select('post_id')
        .eq('id', commentIdMaybe)
        .maybeSingle();
      if (data?.post_id) return data.post_id;
    }
    if (ctx.post_id) return ctx.post_id;
    if (objType === 'post' && n.object_id) return n.object_id;
    return null;
  }, []);

  // derive link path (tag vport mode)
  const derivePath = useCallback(
    async (n) => {
      if (!n) return null;
      if (typeof n.link_path === 'string' && n.link_path.startsWith('/noti/post/')) {
        return `${n.link_path}${n.link_path.includes('?') ? '&' : '?'}as=vport&v=${encodeURIComponent(vportId)}`;
      }

      const kind = (n.kind || '').toLowerCase();
      const objType = (n.object_type || '').toLowerCase();
      const ctx = ensureContext(n.context);

      if (kind === 'comment_like' || objType === 'post_comment') {
        const commentId =
          ctx.comment_id || (objType === 'post_comment' ? n.object_id : null);
        const postId = ctx.post_id || (await resolvePostId(n));
        if (postId && commentId) {
          return `/noti/post/${encodeURIComponent(postId)}?commentId=${encodeURIComponent(
            commentId
          )}&as=vport&v=${encodeURIComponent(vportId)}`;
        }
        if (postId) {
          return `/noti/post/${encodeURIComponent(postId)}?as=vport&v=${encodeURIComponent(vportId)}`;
        }
      }

      if (kind.includes('like') || kind.includes('dislike') || kind.includes('rose') || kind === 'post_reaction') {
        const postId =
          ctx.post_id || (objType === 'post' ? n.object_id : null) || (await resolvePostId(n));
        if (postId) {
          const tab = normTab(kind, ctx);
          return `/noti/post/${encodeURIComponent(postId)}?tab=${encodeURIComponent(tab)}&as=vport&v=${encodeURIComponent(vportId)}`;
        }
      }

      const postId =
        ctx.post_id || (objType === 'post' ? n.object_id : null) || (await resolvePostId(n));
      if (postId) {
        return `/noti/post/${encodeURIComponent(postId)}?as=vport&v=${encodeURIComponent(vportId)}`;
      }

      return null;
    },
    [resolvePostId, vportId]
  );

  const markAsReadAndOpen = useCallback(
    async (notif) => {
      await markAsRead(notif.id);
      let path = await derivePath(notif);
      if (!path) {
        const pid =
          ensureContext(notif?.context)?.post_id ||
          (notif?.object_type === 'post' ? notif?.object_id : null);
        if (pid) path = `/noti/post/${encodeURIComponent(pid)}?as=vport&v=${encodeURIComponent(vportId)}`;
      }
      navigate(path || '/notifications');
    },
    [markAsRead, derivePath, navigate, vportId]
  );

  const handleResolved = useCallback((id) => {
    setRows((prev) => prev.filter((n) => n.id !== id));
    window.dispatchEvent(new Event('noti:refresh'));
  }, []);

  const unseenCount = useMemo(() => rows.filter((r) => !r.is_seen).length, [rows]);

  if (!vportId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 text-white">
        <h1 className="text-xl font-semibold mb-4">Vport Notifications</h1>
        <p className="text-neutral-400">Switch to a VPORT to view its inbox.</p>
      </div>
    );
  }

  const headingText = 'VPORT Notifications' + (unseenCount ? ` (${unseenCount})` : '');

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

      {loading ? (
        <div className="py-16 text-center text-neutral-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-neutral-500">No notifications yet</div>
      ) : (
        <>
          {(() => {
            const t = [], e = [];
            for (const n of rows) (isTodayLocal(n.created_at) ? t : e).push(n);
            return (
              <>
                {t.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-sm font-semibold text-neutral-400 mb-2">Today</h2>
                    <ul className="space-y-3">
                      {t.map((n) => (
                        <VportNotificationItem
                          key={n.id}
                          notif={n}
                          onClick={() => markAsReadAndOpen(n)}
                          onResolved={handleResolved}
                        />
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
                      {e.map((n) => (
                        <VportNotificationItem
                          key={n.id}
                          notif={n}
                          onClick={() => markAsReadAndOpen(n)}
                          onResolved={handleResolved}
                        />
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
