// src/features/post/components/ReactionBar.jsx
import React from 'react';
import { usePostReactions } from '@/lib/postReactions';

export default function ReactionBar({ postId }) {
  const { counts, userReaction, toggle, loading } = usePostReactions(postId);

  const btn = (type, label) => (
    <button
      type="button"
      onClick={() => toggle(type)}
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
