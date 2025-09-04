// src/features/posts/ui/PostHeader.jsx
/**
 * Presentational header for a post: avatar/name + actions (subscribe/message) + menu.
 * Pure UI: all decisions and handlers come from props.
 */
import { memo } from 'react';
import UserLink from '@/components/UserLink';
import PostMenu from './PostMenu';

function PostHeader({
  author,                 // { type:'user'|'vport', id, display_name?, username?, name?, avatar_url? }
  authorType = 'user',    // 'user' | 'vport'
  timestamp,              // preformatted string to show (e.g., "5m ago")
  canSubscribe = false,
  isSubscribed = false,
  onToggleSubscribe = () => {},
  canMessage = false,
  onMessage = () => {},
  canDelete = false,
  onDelete = () => {},
  onReport = () => {},
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <UserLink
        user={author}
        authorType={authorType}
        avatarSize="w-9 h-9"
        avatarShape="rounded-md"
        textSize="text-sm"
        showTimestamp
        timestamp={timestamp}
      />

      <div className="flex gap-2 items-center">
        {canSubscribe && (
          <button
            onClick={onToggleSubscribe}
            className={`text-xs px-2 py-1 rounded ${isSubscribed ? 'bg-purple-600' : 'bg-neutral-700'} text-white`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        )}

        {canMessage && (
          <button
            onClick={onMessage}
            className="text-xs px-2 py-1 rounded bg-neutral-700 text-white"
          >
            Message
          </button>
        )}

        <PostMenu canDelete={canDelete} onDelete={onDelete} onReport={onReport} />
      </div>
    </div>
  );
}

export default memo(PostHeader);
