// CommentCard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import UserLink from './UserLink'; // Assuming UserLink is in the same directory or adjust path

export default function CommentCard({ comment }) {
  const { user: currentUser } = useAuth();
  const [replies, setReplies] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    // Function to load replies for this specific comment
    const loadReplies = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles(*)') // Select profile data for replies
        .eq('parent_id', comment.id) // Get replies for this comment.id
        .order('created_at', { ascending: true });
      setReplies(data || []);
    };

    // Function to load likes for this specific comment by the current user
    const loadLikes = async () => {
      if (!currentUser?.id) { // Only load likes if a user is logged in
        setLikeCount(0);
        setLiked(false);
        return;
      }
      const { data, count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact' }) // Get total count of likes
        .eq('comment_id', comment.id); // For this specific comment

      // Check if the current user has liked this comment
      const userHasLiked = data?.some(like => like.user_id === currentUser.id);

      setLikeCount(count || 0); // Total count
      setLiked(userHasLiked); // If current user has liked it
    };

    loadReplies();
    loadLikes();
    // Dependencies: comment.id ensures re-fetch if the comment prop changes
    // currentUser.id ensures re-fetch of like status if the logged-in user changes
  }, [comment.id, currentUser?.id]); // Add currentUser?.id to dependencies for like status

  const handleReply = async () => {
    if (!replyText.trim()) return;
    if (!currentUser) return; // Ensure user is logged in to reply

    const { data: newReply, error } = await supabase.from('post_comments').insert({
      post_id: comment.post_id, // Link reply to the original post
      parent_id: comment.id,    // This comment is the parent of the reply
      user_id: currentUser.id,
      content: replyText,
    }).select('*, profiles(*)').single(); // Get the inserted data including profile for optimistic update

    if (error) {
      console.error('Failed to send reply:', error);
      // toast.error('Failed to send reply'); // You might want a toast here
    } else {
      setReplies((prevReplies) => [...prevReplies, newReply]); // Optimistic UI update
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return; // Ensure user is logged in to like

    let newLikeCount = likeCount;
    let newLikedStatus = liked;

    if (liked) { // If currently liked, unlike it
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.id);
      if (!error) {
        newLikeCount = Math.max(0, likeCount - 1); // Decrement, ensure not negative
        newLikedStatus = false;
      }
    } else { // If not liked, like it
      const { error } = await supabase
        .from('comment_likes')
        .insert({ comment_id: comment.id, user_id: currentUser.id }); // Insert new like
      if (!error) {
        newLikeCount = likeCount + 1;
        newLikedStatus = true;
      }
    }

    setLikeCount(newLikeCount);
    setLiked(newLikedStatus);
  };

  return (
    <div className="ml-2 mt-2">
      <div className="bg-neutral-700 p-3 rounded-xl text-white text-sm">
        <div className="flex items-center justify-between">
          {/* UserLink component to display user profile */}
          <UserLink user={comment.profiles} textSize="text-sm" avatarClass="w-6 h-6" />
        </div>

        <p className="mt-1 whitespace-pre-line">{comment.content}</p>

        <div className="text-xs text-gray-400 flex gap-4 mt-2 items-center">
          {/* Display time since comment was created */}
          <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>

          {/* Like button with dynamic styling and count */}
          <button
            onClick={handleLike}
            className={`hover:opacity-80 transition ${liked ? 'text-red-400' : ''}`}
            disabled={!currentUser} // Disable if not logged in
          >
            ❤️ {likeCount}
          </button>

          {/* Reply button to toggle reply input */}
          <button
            onClick={() => setShowReplyInput((v) => !v)}
            className="hover:underline"
            disabled={!currentUser} // Disable if not logged in
          >
            Reply
          </button>

          {/* Edit and Delete buttons (only for current user's comments) */}
          {currentUser?.id === comment.user_id && (
            <>
              <button className="text-yellow-400 hover:underline">Edit</button>
              <button className="text-red-400 hover:underline">Delete</button>
            </>
          )}
        </div>
      </div>

      {showReplyInput && currentUser && ( // Show reply input only if logged in
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
            disabled={!replyText.trim()} // Disable if reply is empty
          >
            Post
          </button>
        </div>
      )}

      {/* Recursively render replies */}
      {replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {replies.map((r) => (
            <CommentCard key={r.id} comment={r} /> // Recursive call for nested replies
          ))}
        </div>
      )}
    </div>
  );
}