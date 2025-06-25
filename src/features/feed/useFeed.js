import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PAGE_SIZE = 5;

export function useFeed(userId) {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Fetch viewer's age group
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
      const from = page * PAGE_SIZE;
      const { data: newPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      const updatedProfiles = { ...profiles };
      const filteredPosts = [];

      for (const post of newPosts || []) {
        const uid = post.user_id;

        if (!updatedProfiles[uid]) {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('is_adult, display_name, photo_url')
            .eq('id', uid)
            .maybeSingle();

          if (!profErr && prof) {
            updatedProfiles[uid] = {
              id: uid,
              is_adult: prof.is_adult,
              display_name: prof.display_name,
              photo_url: prof.photo_url,
            };
          }
        }

        const author = updatedProfiles[uid];
        if (author && author.is_adult === viewerIsAdult) {
          filteredPosts.push(post);
        }
      }

      setProfiles(updatedProfiles);
      setPosts(prev => [...prev, ...filteredPosts]);
      setPage(prev => prev + 1);
      setHasMore(newPosts.length === PAGE_SIZE);
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
