// src/features/notifications/screen/views/NotificationsScreenView.jsx
import { useIdentity } from '@/state/identity/identityContext'
import useNotifications from '../../inbox/hooks/useNotifications'
import { useNotificationsHeader } from '../../inbox/hooks/useNotificationsHeader'

import NotificationsView from '../../inbox/ui/Notifications.view'
import NotificationsHeader from '../../inbox/ui/NotificationsHeader.view'

export default function NotificationsScreenView() {
  const { identity } = useIdentity()

  const listState = useNotifications()
  const headerState = useNotificationsHeader(identity?.actorId ?? null)

  return (
    <div className="flex flex-col h-full min-h-0">
      <NotificationsHeader
        unreadCount={headerState.unreadCount}
        onMarkAllSeen={headerState.markAllSeen}
      />

      {/* ✅ scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto -webkit-overflow-scrolling-touch">
        <NotificationsView {...listState} />
      </div>
    </div>
  )
}
