// src/features/posts/ui/ReactionBar.jsx
/**
 * Reactions row: 👍 👎 and optional 🌹. Pure UI + callback out.
 */
import { memo } from 'react';

function ReactionBar({
  authorType,
  canActAsVport,
  reactionBusy = false,
  likeCount = 0,
  dislikeCount = 0,
  roseCount = 0,
  userReaction = null,          // 'like' | 'dislike' | null
  showRoses = false,
  onReact = () => {},           // (kind: 'like'|'dislike'|'rose') => void
}) {
  const disabled = !!reactionBusy;

  return (
    <div className="flex flex-wrap gap-3 items-center mb-2">
      <button
        onClick={() => onReact('like')}
        aria-pressed={userReaction === 'like'}
        disabled={disabled}
        className={`text-sm px-2 py-1 rounded ${userReaction === 'like' ? 'bg-purple-600' : 'bg-neutral-700'} text-white disabled:opacity-60`}
      >
        👍 {likeCount}
      </button>

      <button
        onClick={() => onReact('dislike')}
        aria-pressed={userReaction === 'dislike'}
        disabled={disabled}
        className={`text-sm px-2 py-1 rounded ${userReaction === 'dislike' ? 'bg-red-600' : 'bg-neutral-700'} text-white disabled:opacity-60`}
      >
        👎 {dislikeCount}
      </button>

      {showRoses && (
        <button
          onClick={() => onReact('rose')}
          disabled={disabled}
          className="text-sm px-2 py-1 rounded bg-neutral-700 text-white disabled:opacity-60"
        >
          🌹 {roseCount}
        </button>
      )}
    </div>
  );
}

export default memo(ReactionBar);
