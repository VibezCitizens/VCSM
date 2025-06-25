import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/hooks/useAuth';

const PAGE_SIZE = 5;

export default function CentralFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const refreshFeed = async () => {
    setPage(0);
    setPosts([]);
    setProfiles({});
    setHasMore(true);
    await fetchPosts(true);
  };

  useEffect(() => {
    async function loadViewerProfile() {
      if (!user?.id) return setViewerIsAdult(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('is_adult')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading viewer profile:', error);
        return setViewerIsAdult(null);
      }

      setViewerIsAdult(data?.is_adult ?? null);
    }

    loadViewerProfile();
  }, [user]);

  const fetchPosts = useCallback(async (reset = false) => {
    if (loadingRef.current || !hasMore || viewerIsAdult === null) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const currentPage = reset ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const { data: newPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      const updatedProfiles = reset ? {} : { ...profiles };
      const filteredPosts = [];

      for (const post of newPosts || []) {
        const uid = post.user_id;
        if (!updatedProfiles[uid]) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('is_adult, display_name, photo_url, username') // ✅ include username
            .eq('id', uid)
            .maybeSingle();
          if (prof) {
            updatedProfiles[uid] = {
              id: uid,
              is_adult: prof.is_adult,
              display_name: prof.display_name,
              photo_url: prof.photo_url,
              username: prof.username, // ✅ add this
            };
          }
        }

        const author = updatedProfiles[uid];
        if (author && author.is_adult === viewerIsAdult) {
          filteredPosts.push(post);
        }
      }

      setProfiles(updatedProfiles);
      setPosts(prev => reset ? filteredPosts : [...prev, ...filteredPosts]);
      setPage(prev => reset ? 1 : prev + 1);
      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, viewerIsAdult, hasMore, profiles]);

  useEffect(() => {
    if (viewerIsAdult !== null) {
      refreshFeed();
    }
  }, [viewerIsAdult]);

  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 300 &&
        hasMore &&
        !loadingRef.current
      ) {
        fetchPosts();
      }
    }

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [fetchPosts, hasMore]);

  useEffect(() => {
    if (viewerIsAdult === null) return;

    const sub = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
      }, async (payload) => {
        const newPost = payload.new;
        const uid = newPost.user_id;
        let author = profiles[uid];

        if (!author) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('is_adult, display_name, photo_url, username') // ✅ include username here too
            .eq('id', uid)
            .maybeSingle();

          if (!prof) return;

          author = {
            id: uid,
            is_adult: prof.is_adult,
            display_name: prof.display_name,
            photo_url: prof.photo_url,
            username: prof.username, // ✅ keep username
          };

          setProfiles(prev => ({ ...prev, [uid]: author }));
        }

        if (author.is_adult === viewerIsAdult) {
          setPosts(prev => [newPost, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [viewerIsAdult, profiles]);

  return (
    <div className="space-y-6">
      {!loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No posts found for your age group.</p>
      )}

      {posts.map(post => (
        <PostCard key={post.id} post={post} user={profiles[post.user_id] || {}} />
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

      <Link
        to="/upload"
        className="fixed bottom-6 right-6 bg-black rounded-full p-4 z-50 hover:bg-neutral-800"
        title="Create Post"
      >
        <PlusCircle size={28} color="#fff" />
      </Link>
    </div>
  );
}
