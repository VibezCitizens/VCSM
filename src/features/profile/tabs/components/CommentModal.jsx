import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import UserLink from '@/components/UserLink';

export default function CommentModal({ postId, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  // Fetch comments
  useEffect(() => {
    if (!postId) return;

    const loadComments = async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load comments');
        return;
      }

      setComments(data);
    };

    loadComments();
  }, [postId]);

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);

    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error('Failed to send comment');
    } else {
      setComments([...comments, {
        content: newComment,
        user_id: user.id,
        profiles: {
          id: user.id,
          display_name: user.user_metadata.display_name,
          photo_url: user.user_metadata.avatar_url,
        },
      }]);
      setNewComment('');
    }

    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-neutral-900 rounded-t-2xl p-4 max-h-[80vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center text-white font-semibold mb-2">
          Comments
        </div>

        <div
          ref={scrollRef}
          className="overflow-y-auto space-y-4 max-h-[50vh] px-1"
        >
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2 items-start">
              <img
                src={c.profiles?.photo_url || '/default-avatar.png'}
                className="w-8 h-8 rounded object-cover border"
              />
              <div className="flex flex-col text-white">
                <span className="font-medium">{c.profiles?.display_name || 'User'}</span>
                <span className="text-sm text-neutral-300">{c.content}</span>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 rounded bg-neutral-800 text-white border border-neutral-600"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-white text-black px-3 py-2 rounded"
            disabled={loading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
