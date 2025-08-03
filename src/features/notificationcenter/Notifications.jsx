// src/features/notificationcenter/Notifications.jsx
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import NotificationItem from '@/features/notificationcenter/NotificationItem';
import { useCallback } from 'react';

export default function Notifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  const navigate = useNavigate();

  const handleClick = useCallback(
    async (notif) => {
      await markAsRead(notif.id);

      const { type, metadata } = notif;
      switch (type) {
        case 'post_reaction':
        case 'post_rose':
          metadata?.post_id && navigate(`/noti/post/${metadata.post_id}`);
          break;
        case 'story_reaction':
          metadata?.story_id && navigate(`/noti/story/${metadata.story_id}`);
          break;
        case 'message':
          metadata?.conversation_id && navigate(`/noti/message/${metadata.conversation_id}`);
          break;
        case 'follow':
          metadata?.follower_id && navigate(`/profile/${metadata.follower_id}`);
          break;
        default:
          console.warn('[Notifications] ❌ Unhandled type:', type, metadata);
      }
    },
    [markAsRead, navigate]
  );

  return (
    <div className="p-4 text-white max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">
        Notifications {unreadCount > 0 && <span>({unreadCount})</span>}
      </h1>

      {notifications.length === 0 ? (
        <p className="text-neutral-500">No notifications yet.</p>
      ) : (
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
