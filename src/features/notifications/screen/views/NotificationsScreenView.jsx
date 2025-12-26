// src/features/notifications/screen/views/NotificationsScreenView.jsx
import { useIdentity } from '@/state/identity/identityContext'
import useNotifications from '../../inbox/hooks/useNotifications'
import { useNotificationsHeader } from '../../inbox/hooks/useNotificationsHeader'

import NotificationsView from '../../inbox/ui/Notifications.view'
import NotificationsHeader from '../../inbox/ui/NotificationsHeader.view'

export default function NotificationsScreenView() {
  const { identity } = useIdentity()

  // domain hooks
  const listState = useNotifications()
  const headerState = useNotificationsHeader(identity?.actorId ?? null)

  return (
    <>
      <NotificationsHeader
        unreadCount={headerState.unreadCount}
        onMarkAllSeen={headerState.markAllSeen}
      />

      <NotificationsView {...listState} />
    </>
  )
}
