// src/features/noti/NotiViewPostScreen.jsx (or your current path)
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/data/data'; // centralized DAL
import Spinner from '@/components/Spinner';
import PostCard from '@/features/posts/components/PostCard';

export default function NotiViewPostScreen() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const commentId = searchParams.get('commentId') || null;

  const [post, setPost] = useState(null);   // normalized { id, type:'user'|'vport', authorId, ... }
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!postId) return;

    (async () => {
      setLoading(true);

      // 1) Try regular user/vport-in-posts table
      const p1 = await supabase
        .from('posts')
        .select('id, created_at, user_id, vport_id, media_type, title, text, media_url, deleted, visibility')
        .eq('id', postId)
        .maybeSingle();

      let normalized = null;

      if (p1.data && !p1.error) {
        const row = p1.data;
        // Optional: gate on deleted/visibility if you want
        // if (row.deleted || row.visibility !== 'public') { navigate('/'); return; }

        const isVport = !!row.vport_id;
        normalized = {
          id: row.id,
          created_at: row.created_at,
          type: isVport ? 'vport' : 'user',
          authorId: isVport ? row.vport_id : row.user_id,
          media_type: row.media_type || null,
          title: row.title ?? row.text ?? null,
          text: row.text ?? null,
          media_url: row.media_url ?? null,
          source: 'posts',
          raw: row,
        };
      } else {
        // 2) Try vport_posts
        const p2 = await supabase
          .from('vport_posts')
          .select('id, created_at, vport_id, created_by, media_type, title, body, media_url')
          .eq('id', postId)
          .maybeSingle();

        if (p2.data && !p2.error) {
          const row = p2.data;
          normalized = {
            id: row.id,
            created_at: row.created_at,
            type: 'vport',
            authorId: row.vport_id,
            media_type: row.media_type || null,
            title: row.title ?? row.body ?? null,
            text: row.body ?? null,
            media_url: row.media_url ?? null,
            source: 'vport_posts',
            raw: row,
          };
        }
      }

      if (!normalized) {
        if (!cancelled) {
          setLoading(false);
          navigate('/', { replace: true });
        }
        return;
      }

      // 3) Fetch author via DAL (centralized)
      const authorObj = await db.profiles.getAuthor(normalized.type, normalized.authorId).catch(() => null);
      if (cancelled) return;

      setPost(normalized);
      setAuthor(authorObj);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [postId, navigate]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <Spinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        Post not found.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 py-6 overflow-y-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 mb-4">
        ← Back
      </button>

      {/* PostCard expects the normalized post + author + authorType */}
      <PostCard
        post={post}
        user={author}
        authorType={post.type}            // 'user' | 'vport'
        showComments
        commentHighlightId={commentId}    // your PostCard can use this to scroll/highlight
      />
    </div>
  );
}
