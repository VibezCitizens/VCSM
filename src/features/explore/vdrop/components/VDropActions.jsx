// src/features/vdrop/VDropActions.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Share2 } from 'lucide-react';
import VDropCommentModal from './VDropCommentModal';

// ✅ New helpers aligned to the rebuilt schema (no triggers required)
import {
  fetchReactionState, // -> { likeCount, dislikeCount, roseCount, myReaction }
  setReaction,        // setReaction(postId, 'like'|'dislike'|null)
  giveRoses           // giveRoses(postId, qty)
} from '@/lib/reactions';

export default function VDropActions({ postId, mediaUrl, title }) {
  const { user } = useAuth();

  const [like, setLike] = useState(false);
  const [dislike, setDislike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [roseCount, setRoseCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const loadReactions = async () => {
    try {
      const s = await fetchReactionState(postId);
      setLikeCount(s.likeCount ?? 0);
      setDislikeCount(s.dislikeCount ?? 0);
      setRoseCount(s.roseCount ?? 0);
      setLike(s.myReaction === 'like');
      setDislike(s.myReaction === 'dislike');
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const toggleReaction = async (target /* 'like' | 'dislike' */) => {
    if (!user) return;

    // compute next reaction (toggle off if already set)
    const next =
      target === 'like'
        ? (like ? null : 'like')
        : (dislike ? null : 'dislike');

    // optimistic UI
    const prevLike = like;
    const prevDislike = dislike;
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;

    if (target === 'like') {
      if (prevDislike) setDislikeCount((c) => Math.max(0, c - 1));
      setLikeCount((c) => (prevLike ? Math.max(0, c - 1) : c + 1));
      setLike(!prevLike);
      if (prevDislike) setDislike(false);
    } else {
      if (prevLike) setLikeCount((c) => Math.max(0, c - 1));
      setDislikeCount((c) => (prevDislike ? Math.max(0, c - 1) : c + 1));
      setDislike(!prevDislike);
      if (prevLike) setLike(false);
    }

    try {
      await setReaction(postId, next); // RPC handles insert/update/delete + counters + notifications
      await loadReactions(); // hard sync from server
    } catch (e) {
      // rollback on failure
      setLike(prevLike);
      setDislike(prevDislike);
      setLikeCount(prevLikeCount);
      setDislikeCount(prevDislikeCount);
      console.error('Failed to toggle reaction:', e);
    }
  };

  const sendRose = async () => {
    if (!user) return;

    // optimistic
    const prev = roseCount;
    setRoseCount((c) => c + 1);

    try {
      await giveRoses(postId, 1); // RPC writes to roses_ledger and updates posts.rose_count + notifications
      await loadReactions();      // hard sync
    } catch (e) {
      setRoseCount(prev);         // rollback
      console.error('Failed to send rose:', e);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: title || 'Check this out!',
          text: 'Watch this on Vibez Citizens',
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    }
  };

  useEffect(() => {
    if (postId) loadReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return (
    <>
      {showComments && (
        <VDropCommentModal postId={postId} onClose={() => setShowComments(false)} />
      )}

      <div className="flex flex-col items-center space-y-5 text-white text-xl">
        {/* Like */}
        <button onClick={() => toggleReaction('like')} title="Like" className="flex flex-col items-center">
          <div className="text-2xl">👍</div>
          <span className="text-xs text-white">{likeCount}</span>
        </button>

        {/* Dislike */}
        <button onClick={() => toggleReaction('dislike')} title="Dislike" className="flex flex-col items-center">
          <div className="text-2xl">👎</div>
          <span className="text-xs text-white">{dislikeCount}</span>
        </button>

        {/* Rose */}
        <button onClick={sendRose} title="Send a rose" className="flex flex-col items-center">
          <div className="text-2xl">🌹</div>
          <span className="text-xs text-white">{roseCount}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} title="Comments" className="flex flex-col items-center">
          <div className="text-2xl">💬</div>
          <span className="text-xs text-white">Comments</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} title="Share" className="flex flex-col items-center">
          <Share2 className="w-5 h-5" />
          <span className="text-xs text-white">Share</span>
        </button>
      </div>
    </>
  );
}
