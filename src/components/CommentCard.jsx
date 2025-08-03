import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import UserLink from './UserLink';

export default function CommentCard({ comment, onDelete }) {
  const { user: currentUser } = useAuth();
  const [replies, setReplies] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  useEffect(() => {
    const loadReplies = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles(*)')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });
      setReplies(data || []);
    };

    const loadLikes = async () => {
      if (!currentUser?.id) return;
      const { data, count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact' })
        .eq('comment_id', comment.id);
      const userHasLiked = data?.some(like => like.user_id === currentUser.id);
      setLikeCount(count || 0);
      setLiked(userHasLiked);
    };

    loadReplies();
    loadLikes();
  }, [comment.id, currentUser?.id]);

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser) return;

    const { data: newReply, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: comment.post_id,
        parent_id: comment.id,
        user_id: currentUser.id,
        content: replyText,
      })
      .select('*, profiles(*)')
      .single();

    if (!error) {
      setReplies((prev) => [...prev, newReply]);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;

    if (liked) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.id);
      setLikeCount((c) => Math.max(0, c - 1));
      setLiked(false);
    } else {
      await supabase.from('comment_likes').insert({
        comment_id: comment.id,
        user_id: currentUser.id,
      });
      setLikeCount((c) => c + 1);
      setLiked(true);
    }
  };

  const handleDeleteComment = async () => {
    if (!currentUser || currentUser.id !== comment.user_id) return;

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', comment.id)
      .eq('user_id', currentUser.id);

    if (!error && typeof onDelete === 'function') {
      onDelete(comment.id); // Signal parent to remove this comment from state
    }
  };

  const handleEditComment = async () => {
    if (!editText.trim()) return;

    const { error } = await supabase
      .from('post_comments')
      .update({ content: editText })
      .eq('id', comment.id)
      .eq('user_id', currentUser.id);

    if (!error) {
      comment.content = editText;
      setIsEditing(false);
    }
  };

  return (
    <div className="ml-2 mt-2">
      <div className="bg-neutral-700 p-3 rounded-xl text-white text-sm">
        <div className="flex items-center justify-between">
          <UserLink user={comment.profiles} textSize="text-sm" avatarClass="w-6 h-6" />
        </div>

        {!isEditing ? (
          <p className="mt-1 whitespace-pre-line">{comment.content}</p>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-neutral-800 text-white p-2 text-sm rounded-md border border-neutral-600 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={handleEditComment} className="bg-purple-600 px-3 py-1 rounded-md text-sm hover:bg-purple-700">Save</button>
              <button onClick={() => { setIsEditing(false); setEditText(comment.content); }} className="text-gray-400 hover:underline text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 flex gap-4 mt-2 items-center">
          <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
          <button onClick={handleLike} className={`hover:opacity-80 transition ${liked ? 'text-red-400' : ''}`} disabled={!currentUser}>❤️ {likeCount}</button>
          <button onClick={() => setShowReplyInput(v => !v)} className="hover:underline" disabled={!currentUser}>Reply</button>
          {currentUser?.id === comment.user_id && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="text-yellow-400 hover:underline">Edit</button>
              <button onClick={handleDeleteComment} className="text-red-400 hover:underline">Delete</button>
            </>
          )}
        </div>
      </div>

      {showReplyInput && currentUser && (
        <div className="flex mt-2 ml-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="bg-neutral-800 text-white p-2 text-sm flex-1 rounded-l-md border border-neutral-600"
            placeholder="Write a reply..."
          />
          <button onClick={handleReply} className="bg-purple-600 px-3 rounded-r-md text-sm hover:bg-purple-700" disabled={!replyText.trim()}>Post</button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {replies.map((r) => (
            <CommentCard key={r.id} comment={r} />
          ))}
        </div>
      )}
    </div>
  );
}
