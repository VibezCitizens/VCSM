// src/features/posts/components/CommentModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/data/data';
import toast from 'react-hot-toast';

import CommentCard from '@/features/post/components/CommentCard';

export default function CommentModal({ postId, onClose, pollMs = 0 }) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    if (!postId) {
      setComments([]);
      return;
    }
    try {
      const list = await db.comments.listTopLevel({ authorType: 'user', postId });
      setComments(list || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    }
  };

  useEffect(() => {
    let timer;
    fetchComments();
    if (pollMs > 0) {
      timer = setInterval(fetchComments, pollMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, pollMs]);

  const handlePostComment = async () => {
    const content = newComment.trim();
    if (!content) return toast.error('Comment cannot be empty.');
    if (!currentUser?.id) return toast.error('You must be logged in.');

    try {
      const created = await db.comments.create({
        authorType: 'user',
        postId,
        userId: currentUser.id,
        content,
        asVport: false,
        actorVportId: null,
      });

      // Optimistic add
      setComments((prev) => [...prev, created]);
      setNewComment('');
      toast.success('Comment posted!');
      // Ensure fully synced
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleLocalDelete = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-white text-lg font-bold">Comments</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchComments}
            className="text-sm text-purple-300 hover:text-white"
            title="Refresh"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="text-gray-300 text-xl hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              postAuthorType="user"
              onDelete={() => handleLocalDelete(comment.id)} // ✅ correct prop name
            />
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
