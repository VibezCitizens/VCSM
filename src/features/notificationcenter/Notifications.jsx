// src/features/notificationcenter/Notifications.jsx
import { useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '@/features/notificationcenter/NotificationItem';

export default function Notifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  // 👇 stable options (avoid recreating the object every render)
  const notifOpts = useMemo(
    () => ({
      excludeTypes: ['message'], // hide message notifications
      refreshMs: 60_000,         // background soft refresh every 60s
      limit: 50,
    }),
    []
  );

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllSeen,
  } = useNotifications(userId, notifOpts);

  // Mark all as "seen" when the screen opens for this user
  useEffect(() => {
    if (userId) markAllSeen();
  }, [userId, markAllSeen]);

  const handleClick = useCallback(
    async (notif) => {
      await markAsRead(notif.id);

      const { type, metadata } = notif;
      switch (type) {
        case 'post_reaction':
        case 'post_rose': {
          if (metadata?.post_id) {
            const q = metadata?.comment_id ? `?commentId=${encodeURIComponent(metadata.comment_id)}` : '';
            navigate(`/noti/post/${encodeURIComponent(metadata.post_id)}${q}`);
          }
          break;
        }
        case 'story_reaction': {
          if (metadata?.story_id) {
            navigate(`/noti/story/${encodeURIComponent(metadata.story_id)}`);
          }
          break;
        }
        case 'follow': {
          if (metadata?.follower_id) {
            navigate(`/profile/${encodeURIComponent(metadata.follower_id)}`);
          }
          break;
        }
        case 'message': {
          // Normally excluded, but safe fallback if any slip through
          if (metadata?.conversation_id) {
            navigate(`/chat/${encodeURIComponent(metadata.conversation_id)}`);
          }
          break;
        }
        default:
          // no-op
          break;
      }
    },
    [markAsRead, navigate]
  );

  return (
    <div className="p-4 text-white max-w-xl mx-auto">
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-xl font-semibold">
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </h1>
        {loading && <span className="text-xs text-white/60">Refreshing…</span>}
      </div>

      {!notifications.length && !loading && (
        <p className="text-neutral-500">No notifications yet.</p>
      )}

      {!!notifications.length && (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onClick={() => handleClick(notif)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
