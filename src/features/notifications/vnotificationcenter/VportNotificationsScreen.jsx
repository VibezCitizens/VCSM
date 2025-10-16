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
    try {
      return JSON.parse(ctx);
    } catch {
      return {};
    }
  }
  return {};
}

/** Composite cursor for stable keyset pagination */
function makeCursor(row) {
  return row ? { created_at: row.created_at, id: row.id } : null;
}

export default function VportNotificationsScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  // Require active VPORT
  const vportId = identity?.type === 'vport' ? String(identity?.vportId || '') : null;
  const userId = identity?.userId || identity?.id || null; // who owns the vport

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cursor, setCursor] = useState(null); // { created_at, id }
  const [hasMore, setHasMore] = useState(true);
  const [paging, setPaging] = useState(false);
  const [err, setErr] = useState('');

  // fetch a page (VPORT inbox only) — stable keyset on (created_at DESC, id DESC)
  const fetchPage = useCallback(
    async ({ before } = {}) => {
      if (!userId || !vportId) return [];

      let q = supabase
        .schema('vc')
        .from('notifications_with_actor')
        .select('*')
        .eq('user_id', userId)
        .eq('context->>vport_id', vportId) // ensure string compare
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (before?.created_at && before?.id) {
        const createdAt = encodeURIComponent(before.created_at);
        const id = encodeURIComponent(String(before.id));
        q = q.or(
          `and(created_at.lt.${createdAt}),and(created_at.eq.${createdAt},id.lt.${id})`
        );
      }

      const { data, error } = await q;
      if (error) throw error;

      const page = (data ?? []).map((n) => {
        const sender = n.actor_profile_id
          ? {
              id: n.actor_profile_id,
              display_name: n.actor_display_name,
              username: n.actor_username,
              photo_url: n.actor_photo_url,
            }
          : null;
        const context = ensureContext(n.context);
        return { ...n, sender, context };
      });

      return page;
    },
    [userId, vportId]
  );

  // initial load
  useEffect(() => {
    if (!userId || !vportId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const page = await fetchPage();
        if (cancel) return;
        setRows(page);
        setHasMore(page.length === PAGE_SIZE);
        setCursor(makeCursor(page[page.length - 1]));
        window.dispatchEvent(new Event('noti:refresh'));
      } catch (e) {
        if (!cancel) setErr(e?.message || 'Failed to load notifications.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId, vportId, fetchPage]);

  // section split
  const { todayRows, earlierRows } = useMemo(() => {
    const t = [];
    const e = [];
    for (const n of rows) {
      (isTodayLocal(n.created_at) ? t : e).push(n);
    }
    return { todayRows: t, earlierRows: e };
  }, [rows]);

  // mark single (owner can update their own rows under RLS)
  const markAsRead = useCallback(async (id) => {
    try {
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', id);
      setRows((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, is_seen: true } : n))
      );
      window.dispatchEvent(new Event('noti:refresh'));
    } catch {
      // ignore
    }
  }, []);

  // mark all seen (VPORT inbox only)
  const markAllSeen = useCallback(async () => {
    if (!userId || !vportId) return;
    try {
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_seen: true })
        .eq('user_id', userId)
        .eq('is_seen', false)
        .eq('context->>vport_id', vportId);
    } catch {
      // best-effort; ignore
    }

    try {
      const page = await fetchPage();
      setRows(page);
      setHasMore(page.length === PAGE_SIZE);
      setCursor(makeCursor(page[page.length - 1]));
    } catch {
      setRows((prev) => prev.map((n) => ({ ...n, is_seen: true })));
    }
    window.dispatchEvent(new Event('noti:refresh'));
  }, [fetchPage, userId, vportId]);

  // pagination
  const loadMore = useCallback(async () => {
    if (!userId || !vportId || !hasMore || paging || !cursor) return;
    setPaging(true);
    setErr('');
    try {
      const page = await fetchPage({ before: cursor });
      setRows((prev) => [...prev, ...(page ?? [])]);
      setHasMore((page?.length || 0) === PAGE_SIZE);
      setCursor(makeCursor(page?.[page.length - 1]));
    } catch (e) {
      setErr(e?.message || 'Failed to load more.');
    } finally {
      setPaging(false);
    }
  }, [userId, vportId, hasMore, paging, cursor, fetchPage]);

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

  // derive link path (now tags vport actor so the viewer enforces VPORT mode)
  const derivePath = useCallback(
    async (n) => {
      if (!n) return null;
      if (typeof n.link_path === 'string' && n.link_path.startsWith('/noti/post/')) {
        // Ensure we carry vport context even if link_path exists
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

      if (
        kind.includes('like') ||
        kind.includes('dislike') ||
        kind.includes('rose') ||
        kind === 'post_reaction'
      ) {
        const postId =
          ctx.post_id ||
          (objType === 'post' ? n.object_id : null) ||
          (await resolvePostId(n));
        if (postId) {
          const tab = normTab(kind, ctx);
          return `/noti/post/${encodeURIComponent(postId)}?tab=${encodeURIComponent(
            tab
          )}&as=vport&v=${encodeURIComponent(vportId)}`;
        }
      }

      const postId =
        ctx.post_id ||
        (objType === 'post' ? n.object_id : null) ||
        (await resolvePostId(n));
      if (postId) {
        return `/noti/post/${encodeURIComponent(postId)}?as=vport&v=${encodeURIComponent(vportId)}`;
      }

      return null;
    },
    [resolvePostId, vportId]
  );

  const handleOpen = useCallback(
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
            const t = [];
            const e = [];
            for (const n of rows) {
              (isTodayLocal(n.created_at) ? t : e).push(n);
            }
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
                          onClick={() => handleOpen(n)}
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
                          onClick={() => handleOpen(n)}
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
