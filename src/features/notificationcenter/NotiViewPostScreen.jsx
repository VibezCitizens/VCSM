import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import PostItem from '@/components/PostCard';

export default function NotiViewPostScreen() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const commentId = searchParams.get('commentId');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const commentRef = useRef(null);

  const fetchPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        comments(*, profiles(*))
      `)
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Failed to fetch post:', error);
      navigate('/');
      return;
    }

    setPost(data);
    setLoading(false);
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  useEffect(() => {
    if (commentId && post?.comments?.length > 0) {
      const target = document.getElementById(`comment-${commentId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [post, commentId]);

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
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 mb-4"
      >
        ← Back
      </button>

      <PostItem post={post} showComments commentHighlightId={commentId} />
    </div>
  );
}
