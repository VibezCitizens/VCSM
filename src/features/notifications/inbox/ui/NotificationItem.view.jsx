import FollowRequestItem from '@/features/notifications/types/follow/FollowRequestItem.view'
import AcceptFriendRequestItem from '@/features/notifications/types/follow/AcceptFriendRequestItem'

import CommentNotificationItem from '@/features/notifications/types/comment/CommentNotificationItem.view'
import CommentLikeNotificationItem from '@/features/notifications/types/comment/CommentLikeNotificationItem.view'

import PostLikeNotificationItem from '@/features/notifications/types/reaction/PostLikeNotificationItem.view'
import PostDislikeNotificationItem from '@/features/notifications/types/reaction/PostDislikeNotificationItem.view'
import PostRoseNotificationItem from '@/features/notifications/types/reaction/PostRoseNotificationItem.view'

function DefaultNotification({ notification }) {
  return (
    <div className="text-xs text-neutral-500">
      Unhandled: {notification.kind}
    </div>
  )
}

export default function NotificationItem({ notification }) {
  switch (notification.kind) {
    case 'follow_request':
      return <FollowRequestItem notification={notification} />

    case 'follow_request_accepted':
      return <AcceptFriendRequestItem notification={notification} />

    case 'comment':
      return <CommentNotificationItem notification={notification} />

    case 'comment_like':
      return <CommentLikeNotificationItem notification={notification} />

    // 🔥 POST REACTIONS (SPLIT)
    case 'like':
      return <PostLikeNotificationItem notification={notification} />

    case 'dislike':
      return <PostDislikeNotificationItem notification={notification} />

    case 'post_rose':
      return <PostRoseNotificationItem notification={notification} />

    default:
      return <DefaultNotification notification={notification} />
  }
}
