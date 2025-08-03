import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import UserLink from '@/components/UserLink';

export default function VDropCommentModal({ postId, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('id, content, created_at, user_id, profiles(id, display_name, username, photo_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;
    const { error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: user.id, content: newComment.trim() });
    if (error) {
      console.error('Comment insert failed:', error);
    } else {
      setNewComment('');
      fetchComments();
    }
  };

  useEffect(() => {
    if (postId) fetchComments();
  }, [postId]);

  const modalContent = (
    <>
      {/* Overlay + comment list */}
      <div className="fixed inset-0 z-[999] bg-black/70 flex justify-center items-end">
        <div className="bg-[#111] w-full rounded-t-2xl p-4 max-h-[75vh] flex flex-col pb-[6.5rem]">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <span className="text-white font-semibold text-base">Comments</span>
            <button onClick={onClose} className="text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 text-white text-sm pr-1 min-h-0">
            {loading ? (
              <p className="text-center text-gray-400">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500">No comments yet.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="border-b border-white/10 pb-2">
                  <UserLink user={c.profiles} avatarSize="w-6 h-6" textSize="text-xs" />
                  <div className="ml-8 mt-1">{c.content}</div>
                  <div className="ml-8 text-white/40 text-xs">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fixed input bar */}
      <div
        className="fixed bottom-4 left-0 right-0 bg-[#111] p-4 border-t border-white/10 flex gap-2 z-[9999]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          className="comment-input flex-1 rounded bg-white/10 px-3 py-2 text-white text-sm outline-none"
          placeholder="Add a comment…"
          disabled={!user}
        />
        <button
          onClick={addComment}
          disabled={!newComment.trim() || !user}
          className="text-sm text-black bg-white rounded px-4 py-2 font-medium"
        >
          Send
        </button>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
