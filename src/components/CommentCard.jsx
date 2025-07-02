import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import UserLink from './UserLink';

export default function CommentCard({ comment }) {
  const { user: currentUser } = useAuth();
  const [replies, setReplies] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

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
      const { data, count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact' })
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.id);

      setLikeCount(count || 0);
      setLiked(data?.length > 0);
    };

    loadReplies();
    loadLikes();
  }, [comment.id, currentUser.id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    const { error } = await supabase.from('post_comments').insert({
      post_id: comment.post_id,
      parent_id: comment.id,
      user_id: currentUser.id,
      content: replyText,
    });

    if (!error) {
      setReplyText('');
      setShowReplyInput(false);
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles(*)')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });
      setReplies(data || []);
    }
  };

  const handleLike = async () => {
    const { error } = await supabase
      .from('comment_likes')
      .upsert({ comment_id: comment.id, user_id: currentUser.id }, { onConflict: ['comment_id', 'user_id'] });

    if (!error) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  return (
    <div className="ml-2 mt-2">
      <div className="bg-neutral-700 p-3 rounded-xl text-white text-sm">
        <div className="flex items-center justify-between">
          <UserLink user={comment.profiles} textSize="text-sm" avatarClass="w-6 h-6" />
        </div>

        <p className="mt-1 whitespace-pre-line">{comment.content}</p>

        <div className="text-xs text-gray-400 flex gap-4 mt-2 items-center">
          <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
          <button
            onClick={handleLike}
            className={`hover:opacity-80 transition ${liked ? 'text-red-400' : ''}`}
          >
            ❤️ {likeCount}
          </button>
          <button
            onClick={() => setShowReplyInput((v) => !v)}
            className="hover:underline"
          >
            Reply
          </button>
          {currentUser?.id === comment.user_id && (
            <>
              <button className="text-yellow-400 hover:underline">Edit</button>
              <button className="text-red-400 hover:underline">Delete</button>
            </>
          )}
        </div>
      </div>

      {showReplyInput && (
        <div className="flex mt-2 ml-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="bg-neutral-800 text-white p-2 text-sm flex-1 rounded-l-md border border-neutral-600"
            placeholder="Write a reply..."
          />
          <button
            onClick={handleReply}
            className="bg-purple-600 px-3 rounded-r-md text-sm hover:bg-purple-700"
          >
            Post
          </button>
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
