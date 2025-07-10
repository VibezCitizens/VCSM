import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchPostsWithProfiles } from './postUtils'; // ✅ central call

const PAGE_SIZE = 5;

export function useFeed(userId) {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Load viewer age group once
  useEffect(() => {
    async function loadViewer() {
      if (!userId) return setViewerIsAdult(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('is_adult')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Viewer profile error:', error);
        return setViewerIsAdult(null);
      }

      setViewerIsAdult(data?.is_adult ?? null);
    }

    loadViewer();
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    if (loadingRef.current || !hasMore || viewerIsAdult === null) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const { posts: newPosts, updatedProfiles, hasMore: more } =
        await fetchPostsWithProfiles({
          page,
          pageSize: PAGE_SIZE,
          viewerIsAdult,
          profileCache: profiles
        });

      setProfiles(updatedProfiles);
      setPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
      setHasMore(more);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, viewerIsAdult, hasMore, profiles]);

  return {
    posts,
    profiles,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    setProfiles,
    setPage,
    setHasMore,
  };
}
