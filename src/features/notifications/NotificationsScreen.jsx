// src/features/notifications/NotificationsScreen.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import NotificationItem from '@/features/notifications/notificationcenter/NotificationItem';

const PAGE_SIZE = 20;

function isTodayFast(d) {
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
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
  try {
    return JSON.parse(ctx);
  } catch {
    return {};
  }
}

export default function NotificationsScreen() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [paging, setPaging] = useState(false);
  const [err, setErr] = useState('');

  const iBlockedRef = useRef(new Set());
  const blockedMeRef = useRef(new Set());
  const [blocksReady, setBlocksReady] = useState(false);

  // auth -> user id
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUserId(data?.user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // preload block lists
  useEffect(() => {
    if (!userId) {
      setBlocksReady(true);
      return;
    }
    let active = true;
    (async () => {
      const [{ data: myBlocks, error: e1 }, { data: blockedBy, error: e2 }] =
        await Promise.all([
          supabase
            .schema('vc')
            .from('user_blocks')
            .select('blocked_id')
            .eq('blocker_id', userId),
          supabase
            .schema('vc')
            .from('user_blocks')
            .select('blocker_id')
            .eq('blocked_id', userId),
        ]);
      if (!active) return;
      if (e1) console.error('[notifs] load myBlocks error', e1);
      if (e2) console.error('[notifs] load blockedBy error', e2);
      iBlockedRef.current = new Set((myBlocks ?? []).map((r) => r.blocked_id));
      blockedMeRef.current = new Set(
        (blockedBy ?? []).map((r) => r.blocker_id)
      );
      setBlocksReady(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // block filter
  const filterByBlocks = useCallback((page) => {
    const iBlocked = iBlockedRef.current;
    const blockedMe = blockedMeRef.current;
    return (page ?? []).filter((n) => {
      const owner = n.actor_profile_id; // blocks keyed by profile ids (not vport ids)
      if (!owner) return true;
      if (iBlocked.has(owner)) return false;
      if (blockedMe.has(owner)) return false;
      return true;
    });
  }, []);

  // fetch a page (personal inbox only: exclude vport-tagged notifs)
  const fetchPage = useCallback(
    async ({ before } = {}) => {
      if (!userId) return [];
      let q = supabase
        .schema('vc')
        .from('notifications_with_actor')
        .select('*')
        .eq('user_id', userId)
        .filter('context->>vport_id', 'is', null) // exclude VPort inbox
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + (before ? 1 : 0));
      if (before) q = q.lt('created_at', before);

      const { data, error } = await q;

      // 🔎 DEBUG: show a sample raw row from the view to verify emitted columns
      if (!before && process.env.NODE_ENV !== 'production') {
        console.debug('[notifs] view sample row', (data && data[0]) || null);
      }

      if (error) {
        console.error('[notifs] fetch error', error);
        throw error;
      }

      const page = (data ?? []).map((n) => {
        const context = ensureContext(n.context);

        let sender = null;

        // ✅ Prefer vport purely by presence of actor_vport_id
        if (n.actor_vport_id) {
          sender = {
            type: 'vport',
            id: n.actor_vport_id,
            display_name: n.actor_vport_name || 'VPORT',
            slug: n.actor_vport_slug || undefined,
            avatar_url: n.actor_vport_avatar_url || undefined,
            photo_url: n.actor_vport_avatar_url || undefined,
          };
          // 🧪 DEBUG: log the mapping decision
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[notifs] map sender=vport', {
              id: n.id,
              actor_vport_id: n.actor_vport_id,
              name: sender.display_name,
              slug: sender.slug,
            });
          }
        } else if (n.actor_profile_id) {
          sender = {
            type: 'user',
            id: n.actor_profile_id,
            display_name: n.actor_display_name,
            username: n.actor_username || undefined,
            avatar_url: n.actor_photo_url || undefined,
            photo_url: n.actor_photo_url || undefined,
          };
          // 🧪 DEBUG: log the mapping decision
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[notifs] map sender=user', {
              id: n.id,
              actor_profile_id: n.actor_profile_id,
              name: sender.display_name,
              username: sender.username,
            });
          }
        } else {
          // 🧪 DEBUG: no actor attached (system/broadcast)
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[notifs] map sender=none', { id: n.id, kind: n.kind });
          }
        }

        return { ...n, sender, context };
      });

      return filterByBlocks(page);
    },
    [userId, filterByBlocks]
  );

  // initial load
  useEffect(() => {
    if (!userId || !blocksReady) return;
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

        // 🧪 DEBUG
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[notifs] loaded page size', page.length, 'trimmed', trimmed.length);
        }

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
  }, [userId, blocksReady, fetchPage]);

  // section split
  const { todayRows, earlierRows } = useMemo(() => {
    const t = [];
    const e = [];
    for (const n of rows) {
      (isTodayFast(new Date(n.created_at)) ? t : e).push(n);
    }
    return { todayRows: t, earlierRows: e };
  }, [rows]);

  // mark single
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
      // 🧪 DEBUG
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[notifs] markAsRead', id);
      }
      window.dispatchEvent(new Event('noti:refresh'));
    } catch (e) {
      console.error('[notifs] markAsRead error', e);
    }
  }, []);

  // mark all seen (personal inbox only)
  const markAllSeen = useCallback(async () => {
    try {
      const { error } = await supabase.schema('vc').rpc('noti_mark_all_seen');
      if (error) throw error;
    } catch (e) {
      console.warn('[notifs] rpc(noti_mark_all_seen) fallback', e?.message || e);
      if (!userId) return;
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_seen: true })
        .eq('user_id', userId)
        .eq('is_seen', false)
        .filter('context->>vport_id', 'is', null); // keep in sync with fetch
    }

    try {
      const page = await fetchPage();
      const trimmed = page.slice(0, PAGE_SIZE);
      setRows(trimmed);
      setHasMore(page.length > PAGE_SIZE);
      setCursor(trimmed[trimmed.length - 1]?.created_at || null);

      // 🧪 DEBUG
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[notifs] markAllSeen -> reload size', page.length);
      }
    } catch {
      setRows((prev) => prev.map((n) => ({ ...n, is_seen: true })));
    }
    window.dispatchEvent(new Event('noti:refresh'));
  }, [fetchPage, userId]);

  // pagination
  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || paging || !cursor) return;
    setPaging(true);
    setErr('');
    try {
      const page = await fetchPage({ before: cursor });
      const trimmed = page.slice(0, PAGE_SIZE);
      setRows((prev) => [...prev, ...trimmed]);
      setHasMore(page.length > PAGE_SIZE);
      setCursor(trimmed[trimmed.length - 1]?.created_at || null);

      // 🧪 DEBUG
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[notifs] loadMore page size', page.length, 'next cursor', cursor);
      }
    } catch (e) {
      setErr(e?.message || 'Failed to load more.');
    } finally {
      setPaging(false);
    }
  }, [userId, hasMore, paging, cursor, fetchPage]);

  // resolve post id for deep-linking
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

  // derive link path from notification
  const derivePath = useCallback(
    async (n) => {
      if (!n) return null;
      if (typeof n.link_path === 'string' && n.link_path.startsWith('/noti/post/')) {
        return n.link_path;
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
          )}`;
        }
        if (postId) return `/noti/post/${encodeURIComponent(postId)}`;
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
          return `/noti/post/${encodeURIComponent(postId)}?tab=${encodeURIComponent(tab)}`;
        }
      }

      const postId =
        ctx.post_id ||
        (objType === 'post' ? n.object_id : null) ||
        (await resolvePostId(n));
      if (postId) return `/noti/post/${encodeURIComponent(postId)}`;

      return null;
    },
    [resolvePostId]
  );

  // open notification
  const handleOpen = useCallback(
    async (notif) => {
      await markAsRead(notif.id);
      let path = await derivePath(notif);
      if (!path) {
        const pid =
          ensureContext(notif?.context)?.post_id ||
          (notif?.object_type === 'post' ? notif?.object_id : null);
        if (pid) path = `/noti/post/${encodeURIComponent(pid)}`;
      }

      // 🧪 DEBUG
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[notifs] open -> path', path);
      }

      navigate(path || '/notifications');
    },
    [markAsRead, derivePath, navigate]
  );

  // resolve handler (kept for compatibility)
  const handleResolved = useCallback((id) => {
    setRows((prev) => prev.filter((n) => n.id !== id));
    window.dispatchEvent(new Event('noti:refresh'));
  }, []);

  const unreadCount = useMemo(
    () => rows.filter((r) => !r.is_seen).length,
    [rows]
  );
  const showLoading = loading || !blocksReady;

  const headingText =
    'Notifications' + (unreadCount ? ` (${unreadCount})` : '');

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
        <div className="py-16 text-center text-neutral-500">
          No notifications yet
        </div>
      ) : (
        <>
          {(() => {
            const t = [];
            const e = [];
            for (const n of rows) {
              (isTodayFast(new Date(n.created_at)) ? t : e).push(n);
            }
            return (
              <>
                {t.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-sm font-semibold text-neutral-400 mb-2">
                      Today
                    </h2>
                    <ul className="space-y-3">
                      {t.map((n) => (
                        <NotificationItem
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
                  <h2 className="text-sm font-semibold text-neutral-400 mb-2">
                    Past Notifications
                  </h2>
                  {e.length === 0 ? (
                    <p className="text-neutral-500">No earlier notifications.</p>
                  ) : (
                    <ul className="space-y-3">
                      {e.map((n) => (
                        <NotificationItem
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
