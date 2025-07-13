import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

import CommentCard from '@/components/CommentCard';


export default function CommentModal({ postId, onClose }) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    if (!postId) {
      setComments([]);
      return;
    }

    const { data, error } = await supabase
      .from('post_comments')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } else {
      setComments(data);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser) {
      toast.error('Comment cannot be empty or user not logged in.');
      return;
    }

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: newComment.trim(),
        parent_id: null,
      })
      .select('*, profiles(*)')
      .single();

    if (error) {
      toast.error('Failed to post comment');
      console.error('Error posting comment:', error);
    } else {
      setComments((prev) => [...prev, data]);
      setNewComment('');
      toast.success('Comment posted!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-white text-lg font-bold">Comments</h2>
        <button onClick={onClose} className="text-gray-300 text-xl hover:text-white">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center text-neutral-400 py-10">No comments yet.</div>
        )}
      </div>

      {currentUser && (
        <div className="border-t border-neutral-800 px-4 py-3 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-neutral-800 text-white p-2 text-sm rounded-md border border-neutral-600 placeholder-neutral-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
          />
          <button
            onClick={handlePostComment}
            className="bg-purple-600 px-4 py-2 rounded-md text-sm text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newComment.trim()}
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
