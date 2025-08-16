// useFeed.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchPostsWithProfiles } from './postUtils';

const PAGE_SIZE = 5;

export function useFeed(userId) {
  const [posts, setPosts] = useState([]);          // unified items: kind 'user' | 'vport'
  const [profiles, setProfiles] = useState({});
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Load viewer age gate once
  useEffect(() => {
    async function loadViewer() {
      if (!userId) {
        setViewerIsAdult(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('is_adult')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Viewer profile error:', error);
        setViewerIsAdult(null);
      } else {
        setViewerIsAdult(data?.is_adult ?? null);
      }
    }
    loadViewer();
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    // wait until we know the viewer’s gate status
    if (loadingRef.current || !hasMore || viewerIsAdult === null) return;

    loadingRef.current = true;
    setLoading(true);
    try {
      const { posts: newItems, updatedProfiles, hasMore: more } =
        await fetchPostsWithProfiles({
          page,
          pageSize: PAGE_SIZE,
          viewerIsAdult,
          profileCache: profiles,
        });

      setProfiles(updatedProfiles);
      setPosts((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
      setHasMore(more);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, viewerIsAdult, hasMore, profiles]);

  return {
    posts,          // items have { kind: 'user' | 'vport', ... }
    profiles,       // cache for user profiles (not used for vports)
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
