// src/features/notificationcenter/VNotiViewPostScreen.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import PostCard from '@/features/posts/components/PostCard';

export default function VNotiViewPostScreen() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const commentId = searchParams.get('commentId') || null;
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!postId) return;

    (async () => {
      setLoading(true);

      // vport_posts only (this stream is for VPORTs)
      const p = await supabase
        .from('vport_posts')
        .select('id, created_at, vport_id, created_by, media_type, title, body, media_url')
        .eq('id', postId)
        .maybeSingle();

      if (p.error || !p.data) {
        if (!cancelled) {
          setLoading(false);
          navigate('/vnotifications', { replace: true });
        }
        return;
      }

      const row = p.data;
      const normalized = {
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

      const { data: vp } = await supabase
        .from('vports')
        .select('id, name, avatar_url')
        .eq('id', normalized.authorId)
        .maybeSingle();

      if (!cancelled) {
        setPost(normalized);
        setAuthor(vp || null);
        setLoading(false);
      }
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
      <PostCard
        post={post}
        user={author}
        authorType="vport"
        showComments
        commentHighlightId={commentId}
      />
    </div>
  );
}
