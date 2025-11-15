import React from 'react';
import { usePostReactions } from '@/lib/postReactions';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import userRoses from '@/data/user/post/roses';
import vportRoses from '@/data/vport/vpost/roses';

export default function ReactionBar({ postId }) {
  const { counts, userReaction, toggle, loading, refresh } = usePostReactions(postId);
  const { user: currentUser } = useAuth();
  const { identity } = useIdentity();

  const willActAsVport = identity?.type === 'vport' && !!identity?.vportId;
  const vportId = willActAsVport ? identity?.vportId : null;

  async function onClick(type) {
    if (loading) return;

    if (type === 'rose') {
      // 🌹 is not a toggle. It’s an additive gift in vc.post_rose_gifts.
      if (!postId || !currentUser?.id) return;
      try {
        if (willActAsVport && vportId) {
          await vportRoses.give({ postId, qty: 1, userId: currentUser.id, vportId });
        } else {
          await userRoses.give({ postId, qty: 1, profileId: currentUser.id });
        }
        // Ask hook to refetch counts/state (so the badge updates)
        await refresh?.();
      } catch (e) {
        console.error('[ReactionBar] rose error', e);
        alert(e?.message || String(e));
      }
      return;
    }

    // 👍 / 👎 keep using the existing toggle (single row in vc.post_reactions)
    try {
      await toggle(type);
    } catch (e) {
      console.error('[ReactionBar] toggle error', e);
      alert(e?.message || String(e));
    }
  }

  const btn = (type, label) => (
    <button
      type="button"
      onClick={() => onClick(type)}
      disabled={loading}
      className={[
        'px-3 py-1 rounded-full text-sm border transition',
        userReaction === type
          ? 'border-purple-500 text-white bg-purple-600'
          : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800',
      ].join(' ')}
      aria-pressed={userReaction === type}
    >
      {label} {counts[type]}
    </button>
  );

  return (
    <div className="flex gap-2">
      {btn('like', '👍')}
      {btn('dislike', '👎')}
      {btn('rose', '🌹')}
    </div>
  );
}
