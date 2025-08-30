// src/features/explore/vdrop/components/VDropActions.jsx
import { useEffect, useState, useMemo } from 'react';
import { Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { db } from '@/data/data';
import VDropCommentModal from './VDropCommentModal';

export default function VDropActions({ postId, source, mediaUrl, title }) {
  const { user } = useAuth();
  const { identity } = useIdentity(); // { type: 'user' | 'vport', vportId? }
  const isVportSource = source === 'vport_posts';
  const authorType = isVportSource ? 'vport' : 'user';

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [roseCount, setRoseCount] = useState(0); // only for user posts
  const [myReaction, setMyReaction] = useState(null); // 'like' | 'dislike' | null
  const [showComments, setShowComments] = useState(false);

  // NEW: busy flags to prevent double-firing
  const [reactBusy, setReactBusy] = useState(false);
  const [roseBusy, setRoseBusy] = useState(false);

  const actingAsVport = identity?.type === 'vport' && !!identity?.vportId;
  const viewerId = user?.id || null;
  const vportId = actingAsVport ? identity.vportId : null;

  const canReact = useMemo(() => {
    if (!viewerId) return false;
    if (authorType === 'user') return true; // user posts support user/vport actors
    // vport posts support only user actors in current RLS
    return !actingAsVport;
  }, [viewerId, authorType, actingAsVport]);

  async function loadReactions() {
    if (!postId) return;

    try {
      const rows = await db.reactions.listForPost({ authorType, postId });

      setLikeCount(rows.filter((r) => r.reaction === 'like').length);
      setDislikeCount(rows.filter((r) => r.reaction === 'dislike').length);

      let mine = null;
      if (authorType === 'vport') {
        if (viewerId) mine = rows.find((r) => r.user_id === viewerId)?.reaction || null;
      } else {
        if (actingAsVport && vportId) {
          mine =
            rows.find((r) => r.as_vport === true && r.actor_vport_id === vportId)?.reaction ||
            null;
        } else if (viewerId) {
          mine =
            rows.find((r) => r.as_vport === false && r.user_id === viewerId)?.reaction ||
            null;
        }
      }
      setMyReaction(mine);

      if (authorType === 'user') {
        const count = await db.roses.count(postId);
        setRoseCount(count || 0);
      } else {
        setRoseCount(0);
      }
    } catch (e) {
      console.error('[VDropActions] loadReactions error:', e);
      setLikeCount(0);
      setDislikeCount(0);
      setMyReaction(null);
      if (authorType === 'user') setRoseCount(0);
    }
  }

  async function toggleReaction(kind, e) {
    e?.stopPropagation?.(); // avoid parent handlers
    if (!canReact || !postId || reactBusy) return;

    setReactBusy(true);

    // Optimistic flip
    setMyReaction((prev) => {
      if (prev === kind) {
        if (kind === 'like') setLikeCount((c) => Math.max(0, c - 1));
        if (kind === 'dislike') setDislikeCount((c) => Math.max(0, c - 1));
        return null;
      } else {
        if (prev === 'like') setLikeCount((c) => Math.max(0, c - 1));
        if (prev === 'dislike') setDislikeCount((c) => Math.max(0, c - 1));
        if (kind === 'like') setLikeCount((c) => c + 1);
        if (kind === 'dislike') setDislikeCount((c) => c + 1);
        return kind;
      }
    });

    try {
      await db.reactions.setForPost({
        authorType,
        postId,
        kind,
        userId: viewerId,
        vportId,
        actingAsVport: actingAsVport && authorType === 'user',
      });
      // Reconcile with server to avoid drift
      await loadReactions();
    } catch (e) {
      console.error('[VDropActions] setForPost error:', e);
      await loadReactions();
    } finally {
      setReactBusy(false);
    }
  }

  async function sendRose(e) {
    e?.stopPropagation?.();
    if (authorType !== 'user' || !viewerId || roseBusy) return;

    setRoseBusy(true);
    setRoseCount((c) => c + 1); // optimistic

    try {
      await db.roses.give({ postId, fromUserId: viewerId, qty: 1 });
      await loadReactions();
    } catch (e) {
      console.error('[VDropActions] give rose error:', e);
      await loadReactions();
    } finally {
      setRoseBusy(false);
    }
  }

  function handleShare() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: title || 'Watch this on Vibez Citizens',
          text: title || '',
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      alert('Link copied to clipboard');
    }
  }

  useEffect(() => {
    loadReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, source, viewerId, actingAsVport, vportId]);

  return (
    <>
      {showComments && (
        <VDropCommentModal
          postId={postId}
          source={source}
          onClose={() => setShowComments(false)}
        />
      )}

      <div className="flex flex-col items-center space-y-5 text-white">
        {/* 👍 */}
        <button
          onClick={(e) => toggleReaction('like', e)}
          className="flex flex-col items-center disabled:opacity-50"
          disabled={!canReact || reactBusy}
          aria-label="Like"
          aria-pressed={myReaction === 'like'}
        >
          <div className={`text-2xl leading-none ${myReaction === 'like' ? 'opacity-100' : 'opacity-80'}`}>👍</div>
          <span className="text-xs mt-1">{likeCount}</span>
        </button>

        {/* 👎 */}
        <button
          onClick={(e) => toggleReaction('dislike', e)}
          className="flex flex-col items-center disabled:opacity-50"
          disabled={!canReact || reactBusy}
          aria-label="Dislike"
          aria-pressed={myReaction === 'dislike'}
        >
          <div className={`text-2xl leading-none ${myReaction === 'dislike' ? 'opacity-100' : 'opacity-80'}`}>👎</div>
          <span className="text-xs mt-1">{dislikeCount}</span>
        </button>

        {/* 🌹 only for user posts */}
        {authorType === 'user' && (
          <button
            onClick={(e) => sendRose(e)}
            className="flex flex-col items-center disabled:opacity-50"
            disabled={!viewerId || roseBusy}
          >
            <div className="text-2xl leading-none">🌹</div>
            <span className="text-xs mt-1">{roseCount}</span>
          </button>
        )}

        {/* Comments */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
          <div className="text-2xl leading-none">💬</div>
          <span className="text-xs mt-1">Comments</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center">
          <Share2 className="w-5 h-5" />
          <span className="text-xs mt-1">Share</span>
        </button>
      </div>
    </>
  );
}
