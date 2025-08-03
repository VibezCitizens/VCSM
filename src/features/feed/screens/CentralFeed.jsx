import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navigate } from 'react-router-dom';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/hooks/useAuth';

const PAGE_SIZE = 5;

export default function CentralFeed() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const feedRef = useRef(null);

  const refreshFeed = async () => {
    setPage(0);
    setPosts([]);
    setProfiles({});
    setHasMore(true);
    await fetchPosts(true);
  };

  const fetchPosts = useCallback(async (reset = false) => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const currentPage = reset ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: newPosts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('deleted', false) // ✅ exclude soft-deleted
        .not('media_type', 'eq', 'video') // ✅ exclude videos
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const updatedProfiles = reset ? {} : { ...profiles };
      const enrichedPosts = [];

      for (const post of newPosts || []) {
        const uid = post.user_id;

        if (!updatedProfiles[uid]) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name, photo_url, username')
            .eq('id', uid)
            .maybeSingle();

          if (prof) {
            updatedProfiles[uid] = {
              id: uid,
              display_name: prof.display_name,
              photo_url: prof.photo_url,
              username: prof.username,
            };
          }
        }

        enrichedPosts.push(post);
      }

      setProfiles(updatedProfiles);
      setPosts(prev => reset ? enrichedPosts : [...prev, ...enrichedPosts]);
      setPage(prev => reset ? 1 : prev + 1);
      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, hasMore, profiles]);

  useEffect(() => {
    refreshFeed();
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 300;
      if (nearBottom && hasMore && !loadingRef.current) {
        fetchPosts();
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [fetchPosts, hasMore]);

  useEffect(() => {
    const sub = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
      }, async (payload) => {
        const newPost = payload.new;
        if (newPost.media_type === 'video' || newPost.deleted) return;

        const uid = newPost.user_id;
        let author = profiles[uid];

        if (!author) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name, photo_url, username')
            .eq('id', uid)
            .maybeSingle();

          if (!prof) return;

          author = {
            id: uid,
            display_name: prof.display_name,
            photo_url: prof.photo_url,
            username: prof.username,
          };

          setProfiles(prev => ({ ...prev, [uid]: author }));
        }

        setPosts(prev => [newPost, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [profiles]);

  return (
    <div
      ref={feedRef}
      className="h-screen overflow-y-auto px-0 py-4 space-y-1 scroll-hidden"
    >
      {!loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          user={profiles[post.user_id] || {}}
          onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} // ✅ supports soft-delete removal
        />
      ))}

      {loading && posts.length === 0 && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-800 h-40 rounded-xl" />
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <p className="text-center text-white">Loading more...</p>
      )}

      {!hasMore && !loading && (
        <p className="text-center text-gray-400">End of feed</p>
      )}
    </div>
  );
}