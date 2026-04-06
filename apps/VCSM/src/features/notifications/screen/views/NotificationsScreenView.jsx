import { useIdentity } from '@/state/identity/identityContext'
import useNotifications from '../../inbox/hooks/useNotifications'
import { useNotificationsHeader } from '../../inbox/hooks/useNotificationsHeader'

import NotificationsView from '../../inbox/ui/Notifications.view'
import NotificationsHeader from '../../inbox/ui/NotificationsHeader.view'
import '@/features/ui/modern/module-modern.css'
import '@/features/profiles/styles/profiles-modern.css'
import '@/features/notifications/styles/notifications-modern.css'

export default function NotificationsScreenView() {
  const { identity } = useIdentity()

  const listState = useNotifications()
  const headerState = useNotificationsHeader(identity?.actorId ?? null)

  return (
    <div className="profiles-modern notifications-modern-page h-full min-h-0 overflow-y-auto">
      <div className="notifications-modern-shell w-full px-3 py-3 sm:px-4">
        <NotificationsHeader
          unreadCount={headerState.unreadCount}
          onMarkAllSeen={headerState.markAllSeen}
        />
        <NotificationsView {...listState} />
      </div>
    </div>
  )
}
