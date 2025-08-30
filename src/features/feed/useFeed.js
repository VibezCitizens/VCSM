// src/features/feed/useFeed.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/data/data';

const PAGE_SIZE = 5;

export function useFeed(userId) {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({}); // user authors
  const [vports, setVports] = useState({});     // vport authors
  const [viewerIsAdult, setViewerIsAdult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);
  const initializedRef = useRef(false);
  const fetchPostsRef = useRef(null);

  // Load viewer age via DAL
  useEffect(() => {
    let cancelled = false;
    setViewerIsAdult(null);
    initializedRef.current = false;

    (async () => {
      try {
        const isAdult = await db.feed.getViewerIsAdult(userId);
        if (!cancelled) setViewerIsAdult(isAdult);
      } catch (err) {
        console.error('Viewer profile error:', err);
        if (!cancelled) setViewerIsAdult(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const fetchPosts = useCallback(async (reset = false) => {
    if (loadingRef.current || viewerIsAdult === null) return;
    if (!reset && !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const currentPage = reset ? 0 : page;

      const {
        items,
        nextHasMore,
        userAuthorCache,
        vportAuthorCache,
      } = await db.feed.fetchPage({
        page: currentPage,
        pageSize: PAGE_SIZE,
        viewerIsAdult,
        // includeVideos defaults to false
        userAuthorCache: reset ? {} : profiles,
        vportAuthorCache: reset ? {} : vports,
      });

      setProfiles(userAuthorCache);
      setVports(vportAuthorCache);
      setPosts(prev => (reset ? items : [...prev, ...items]));
      setPage(prev => (reset ? 1 : prev + 1));
      setHasMore(nextHasMore);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, viewerIsAdult, hasMore, profiles, vports]);

  useEffect(() => { fetchPostsRef.current = fetchPosts; }, [fetchPosts]);

  useEffect(() => {
    if (viewerIsAdult === null) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    setPage(0);
    setPosts([]);
    setProfiles({});
    setVports({});
    setHasMore(true);

    fetchPostsRef.current?.(true);
  }, [viewerIsAdult]);

  return {
    posts,
    profiles,
    vports,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    setProfiles,
    setVports,
    setPage,
    setHasMore,
  };
}

export default useFeed;
