// File: src/features/notificationcenter/Notifications.jsx
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import NotificationItem from '@/features/notificationcenter/NotificationItem';
import { useCallback, useMemo } from 'react';

export default function Notifications() {
  const { user } = useAuth();
  const userId = user?.id;

  const { notifications = [], unreadCount = 0, markAsRead } = useNotifications(userId);
  const navigate = useNavigate();

  const items = useMemo(() => notifications || [], [notifications]);

  const handleClick = useCallback(
    async (notif) => {
      // Mark read, but don't block navigation if it fails
      try {
        await markAsRead(notif.id);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[Notifications] markAsRead failed:', e);
      }

      const { type, metadata = {} } = notif;

      // Prefer new schema columns; fall back to legacy metadata keys
      const sourceId =
        notif.source_id ??
        metadata.post_id ??
        metadata.story_id ??
        metadata.source_id ??
        null;

      const actorId =
        notif.actor_id ??
        metadata.follower_id ??
        metadata.sender_id ??
        null;

      // Route helpers
      const goPost = (id) => id && navigate(`/noti/post/${id}`);
      const goStory = (id) => id && navigate(`/noti/story/${id}`);
      const goMessage = (id) => id && navigate(`/noti/message/${id}`);
      const goProfile = (id) => id && navigate(`/profile/${id}`);

      switch (type) {
        // POSTS
        case 'post_reaction':
        case 'post_rose':
        case 'post_like':
        case 'post_dislike':
        case 'comment_like': {
          goPost(sourceId || metadata.post_id);
          break;
        }

        // STORIES
        case 'story_reaction': {
          goStory(sourceId || metadata.story_id);
          break;
        }

        // MESSAGES
        case 'message': {
          const convoId = metadata.conversation_id || sourceId;
          goMessage(convoId);
          break;
        }

        // SOCIAL
        case 'follow': {
          goProfile(actorId || metadata.follower_id);
          break;
        }

        default: {
          if (import.meta.env.DEV) {
            console.warn('[Notifications] ❌ Unhandled type:', type, {
              notif,
              derived: { sourceId, actorId },
            });
          }
        }
      }
    },
    [markAsRead, navigate]
  );

  return (
    <div className="p-4 text-white max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">
        Notifications {unreadCount > 0 && <span>({unreadCount})</span>}
      </h1>

      {items.length === 0 ? (
        <p className="text-neutral-500">No notifications yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((notif) => (
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
