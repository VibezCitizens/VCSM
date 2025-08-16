// src/features/feed/screens/CentralFeed.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

import PostCard from '@/components/PostCard';
import VPortPostCard from '@/features/vport/VPortPostCard';
import { deleteVPortPost } from '@/features/vport/VPortPostService';
import { fetchPostsWithProfiles } from '@/features/feed/postUtils';

const PAGE_SIZE = 5;

export default function CentralFeed() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  // age gate for user posts
  const [viewerIsAdult, setViewerIsAdult] = useState(null);

  // unified feed list
  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // stable refs to avoid dependency churn / resubscribe loops
  const feedRef = useRef(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const viewerRef = useRef(null);
  const profilesRef = useRef({});

  useEffect(() => { profilesRef.current = profiles; }, [profiles]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { viewerRef.current = viewerIsAdult; }, [viewerIsAdult]);

  // 1) Load viewer’s age flag (once)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_adult')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;
      // if error, default to adult=true so nothing gets hidden by mistake
      setViewerIsAdult(error ? true : Boolean(data?.is_adult));
    })();
    return () => { mounted = false; };
  }, [user.id]);

  // helper to merge a page of results
  const applyPage = useCallback(({ posts, updatedProfiles, reset, more }) => {
    setProfiles(updatedProfiles);
    setItems(prev => (reset ? posts : [...prev, ...posts]));
    setPage(prev => (reset ? 1 : prev + 1));
    setHasMore(more);
  }, []);

  // 2) Fetch one page (stable)
  const fetchPage = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    if (!reset && (!hasMoreRef.current || viewerRef.current === null)) return;

    loadingRef.current = true;
    setLoading(true);
    try {
      const curPage = reset ? 0 : pageRef.current;
      const { posts, updatedProfiles, hasMore: more } = await fetchPostsWithProfiles({
        page: curPage,
        pageSize: PAGE_SIZE,
        viewerIsAdult: viewerRef.current,
        profileCache: reset ? {} : profilesRef.current,
      });
      applyPage({ posts, updatedProfiles, reset, more });
    } catch (e) {
      console.error('feed fetch error:', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [applyPage]);

  // 3) Reset + first page once we know viewerIsAdult
  useEffect(() => {
    if (viewerIsAdult === null) return;
    setItems([]);
    setProfiles({});
    setPage(0);
    setHasMore(true);
    fetchPage(true);
  }, [viewerIsAdult, fetchPage]);

  // 4) Infinite scroll (listener attached once)
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        fetchPage();
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [fetchPage]);

  // 5) Realtime inserts (skip videos for both sources)
  useEffect(() => {
    if (viewerIsAdult === null) return;

    const usersCh = supabase
      .channel('rt:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async ({ new: row }) => {
        // exclude soft-deleted and videos
        if (row.deleted || row.media_type === 'video') return;

        // age gate (minors shown only when viewer is NOT adult)
        let author = profilesRef.current[row.user_id];
        if (!author) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id,is_adult,display_name,photo_url,username')
            .eq('id', row.user_id)
            .maybeSingle();
          if (!prof) return;
          if (viewerRef.current === false && prof.is_adult) return;
          author = prof;
          setProfiles(prev => ({ ...prev, [prof.id]: prof }));
        } else if (viewerRef.current === false && author.is_adult) {
          return;
        }

        setItems(prev => {
          const next = [
            {
              kind: 'user',
              id: row.id,
              user_id: row.user_id,
              text: row.text || '',
              media_type: row.media_type,
              media_url: row.media_url,
              created_at: row.created_at,
              like_count: row.like_count || 0,
              dislike_count: row.dislike_count || 0,
              author,
            },
            ...prev.filter(it => !(it.kind === 'user' && it.id === row.id)),
          ];
          next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return next;
        });
      })
      .subscribe();

    const vportsCh = supabase
      .channel('rt:vport_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vport_posts' }, async ({ new: row }) => {
        // exclude videos here too
        if (row.media_type === 'video') return;

        const { data: v } = await supabase
          .from('vports')
          .select('id,name,avatar_url,verified,city,region,country,updated_at,created_at')
          .eq('id', row.vport_id)
          .maybeSingle();

        setItems(prev => {
          const next = [
            {
              kind: 'vport',
              id: row.id,
              vport_id: row.vport_id,
              created_by: row.created_by,
              created_at: row.created_at,
              body: row.body || '',
              media_type: row.media_type,
              media_url: row.media_url,
              vport: v
                ? {
                    id: v.id,
                    name: v.name,
                    avatar_url: v.avatar_url,
                    verified: Boolean(v.verified),
                    city: v.city,
                    region: v.region,
                    country: v.country,
                    updated_at: v.updated_at,
                    created_at: v.created_at,
                  }
                : { id: row.vport_id, name: 'VPort', verified: false },
            },
            ...prev.filter(it => !(it.kind === 'vport' && it.id === row.id)),
          ];
          next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return next;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersCh);
      supabase.removeChannel(vportsCh);
    };
  }, [viewerIsAdult]);

  return (
    <div ref={feedRef} className="h-screen overflow-y-auto px-0 py-4 space-y-3 scroll-hidden">
      {!loading && items.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}

      {items.map((it) =>
        it.kind === 'vport' ? (
          <VPortPostCard
            key={`vp-${it.id}`}
            post={it}
            canDelete={Boolean(user?.id && it.created_by === user.id)}
            onDelete={async (id) => {
              if (!user?.id || it.created_by !== user.id) return;
              try {
                await deleteVPortPost(id);
                setItems(prev => prev.filter(p => !(p.kind === 'vport' && p.id === id)));
              } catch (e) {
                console.error('Delete vport post failed:', e);
              }
            }}
          />
        ) : (
          <PostCard
            key={`u-${it.id}`}
            post={{
              id: it.id,
              user_id: it.user_id,
              text: it.text,
              media_type: it.media_type,
              media_url: it.media_url,
              created_at: it.created_at,
              like_count: it.like_count,
              dislike_count: it.dislike_count,
            }}
            user={it.author}
            onDelete={(id) =>
              setItems(prev => prev.filter(p => !(p.kind === 'user' && p.id === id)))
            }
          />
        )
      )}

      {loading && items.length === 0 && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-800 h-40 rounded-xl" />
          ))}
        </div>
      )}

      {loading && items.length > 0 && (
        <p className="text-center text-white">Loading more...</p>
      )}

      {!hasMore && !loading && (
        <p className="text-center text-gray-400">End of feed</p>
      )}
    </div>
  );
}
