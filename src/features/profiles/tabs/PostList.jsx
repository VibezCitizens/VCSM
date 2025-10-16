// src/features/post/components/PostList.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import PostCard from '@/features/post/components/PostCard';
import { supabase } from '@/lib/supabaseClient';

const PAGE_SIZE = 20;

export default function PostList({ user }) {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const userId = user?.id;

  const fetchPage = useCallback(
    async (page = 0) => {
      if (!userId) return { rows: [], done: true };

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .schema('vc')
        .from('posts')
        .select(
          `
          id,
          user_id,
          text,
          title,
          media_url,
          media_type,
          post_type,
          created_at
        `
        )
        .eq('user_id', userId)
        .eq('media_type', 'text')
        .or('media_url.is.null,media_url.eq.""')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        rows: data ?? [],
        done: !data || data.length < PAGE_SIZE,
      };
    },
    [userId]
  );

  const fetchProfiles = useCallback(async userIds => {
    if (!userIds.length) return {};

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url, is_adult')
      .in('id', userIds);

    if (error) throw error;

    const map = {};
    for (const p of data) {
      map[p.id] = p;
    }
    return map;
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      pageRef.current = 0;
      const { rows, done } = await fetchPage(0);

      // fetch related profiles
      const userIds = [...new Set(rows.map(r => r.user_id))];
      const profileMap = await fetchProfiles(userIds);

      setPosts(rows);
      setProfiles(profileMap);
      setHasMore(!done);
    } catch (e) {
      setError(e.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [fetchPage, fetchProfiles]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const nextPage = pageRef.current + 1;
      const { rows, done } = await fetchPage(nextPage);

      const userIds = [...new Set(rows.map(r => r.user_id))];
      const profileMap = await fetchProfiles(userIds);

      pageRef.current = nextPage;
      setPosts(prev => [...prev, ...rows]);
      setProfiles(prev => ({ ...prev, ...profileMap }));
      setHasMore(!done);
    } catch (e) {
      setError(e.message || 'Failed to load more.');
    } finally {
      setLoading(false);
    }
  }, [fetchPage, fetchProfiles, hasMore, loading]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  if (error) {
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

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="h-24 animate-pulse rounded bg-neutral-800" />
        <div className="h-24 animate-pulse rounded bg-neutral-800" />
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
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          user={profiles[post.user_id] || {}}
        />
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
