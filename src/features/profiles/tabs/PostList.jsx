// src/features/post/components/PostList.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import PostCard from '@/features/post/components/PostCard';
import { supabase } from '@/lib/supabaseClient';

const PAGE_SIZE = 20;

/**
 * Usage:
 *   <PostList user={profileObj} />                    // fetch by profile (public.profiles.id)
 *   <PostList vportId="c441b8c7-b6fe-4e9f-bc40-..." /> // fetch by vport (vc.vports.id)
 *   <PostList actorId="a8906d01-66e4-4ae0-912c-ad26f4b13009" /> // direct actor override
 *
 * Schema facts:
 * - vc.posts: id, actor_id, user_id, text, title, media_url, media_type, post_type, tags, created_at
 * - vc.actors: id, profile_id, vport_id
 * - No vport_id column on vc.posts → must resolve actor_id first.
 */
export default function PostList({ user, vportId = null, actorId: actorIdProp = null }) {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const profileId = user?.id ?? null;

  // resolved actor
  const [actorId, setActorId] = useState(actorIdProp || null);

  // --- resolve actor_id from either explicit prop, vportId, or profileId
  useEffect(() => {
    let cancelled = false;

    // if caller provided actorId, just use it
    if (actorIdProp) {
      setActorId(actorIdProp);
      return;
    }

    (async () => {
      setError('');
      setActorId(null);

      try {
        const match =
          vportId ? { vport_id: vportId } :
          profileId ? { profile_id: profileId } :
          null;

        if (!match) return;

        const { data, error } = await supabase
          .schema('vc')
          .from('actors')
          .select('id')
          .match(match)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!cancelled) setActorId(data?.id ?? null);
      } catch (e) {
        if (!cancelled) {
          setActorId(null);
          setError(e?.message || 'Failed to resolve actor.');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [actorIdProp, profileId, vportId]);

  const fetchPage = useCallback(
    async (page = 0) => {
      if (!actorId) return { rows: [], done: true };

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Text-only posts per your rule (media_type='text'); tolerate '' or NULL for media_url.
      // NOTE: PostgREST treats empty-string eq as `.eq.` (no quotes). Using .or with that form.
      const query = supabase
        .schema('vc')
        .from('posts')
        .select(`
          id,
          user_id,
          text,
          title,
          media_url,
          media_type,
          post_type,
          tags,
          created_at
        `)
        .eq('actor_id', actorId)
        .eq('media_type', 'text')
        .or('media_url.is.null,media_url.eq.')
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      return {
        rows: data ?? [],
        done: !data || data.length < PAGE_SIZE,
      };
    },
    [actorId]
  );

  const fetchProfiles = useCallback(async (userIds) => {
    if (!userIds.length) return {};
    const { data, error } = await supabase
      .from('profiles') // public.profiles
      .select('id, username, display_name, photo_url, is_adult')
      .in('id', userIds);

    if (error) throw error;

    const map = {};
    for (const p of data) map[p.id] = p;
    return map;
  }, []);

  const loadInitial = useCallback(async () => {
    if (!actorId) return; // wait for actor resolution
    setLoading(true);
    setError('');
    try {
      pageRef.current = 0;
      const { rows, done } = await fetchPage(0);

      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      const profileMap = await fetchProfiles(userIds);

      setPosts(rows);
      setProfiles(profileMap);
      setHasMore(!done);
    } catch (e) {
      setError(e?.message || 'Failed to load posts.');
      setPosts([]);
      setProfiles({});
      setHasMore(true);
    } finally {
      setLoading(false);
    }
  }, [actorId, fetchPage, fetchProfiles]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !actorId) return;
    try {
      setLoading(true);
      const nextPage = pageRef.current + 1;
      const { rows, done } = await fetchPage(nextPage);

      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      const profileMap = await fetchProfiles(userIds);

      pageRef.current = nextPage;
      setPosts((prev) => [...prev, ...rows]);
      setProfiles((prev) => ({ ...prev, ...profileMap }));
      setHasMore(!done);
    } catch (e) {
      setError(e?.message || 'Failed to load more.');
    } finally {
      setLoading(false);
    }
  }, [actorId, fetchPage, fetchProfiles, hasMore, loading]);

  // reload when actor changes
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ---- UI states
  if ((loading && posts.length === 0) || (!actorId && (profileId || vportId || actorIdProp))) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="h-24 animate-pulse rounded bg-neutral-800" />
        <div className="h-24 animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="text-center text-red-400">
        {error}{' '}
        <button
          onClick={loadInitial}
          className="ml-2 rounded px-2 py-1 bg-neutral-800 hover:bg-neutral-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-center text-neutral-500">No text-only posts found.</p>
        <button
          onClick={loadInitial}
          className="ml-3 rounded px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} user={profiles[post.user_id] || {}} />
      ))}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : (
        <div className="py-2 text-center text-neutral-500">End of results</div>
      )}
    </div>
  );
}
