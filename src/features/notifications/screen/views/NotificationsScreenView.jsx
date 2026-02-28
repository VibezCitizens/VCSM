import { useIdentity } from '@/state/identity/identityContext'
import useNotifications from '../../inbox/hooks/useNotifications'
import { useNotificationsHeader } from '../../inbox/hooks/useNotificationsHeader'

import NotificationsView from '../../inbox/ui/Notifications.view'
import NotificationsHeader from '../../inbox/ui/NotificationsHeader.view'
import '@/features/ui/modern/module-modern.css'

export default function NotificationsScreenView() {
  const { identity } = useIdentity()

  const listState = useNotifications()
  const headerState = useNotificationsHeader(identity?.actorId ?? null)

  return (
    <div className="module-modern-page h-full min-h-0">
      <div className="mx-auto w-full max-w-2xl px-3 py-3 sm:px-4">
        <NotificationsHeader
          unreadCount={headerState.unreadCount}
          onMarkAllSeen={headerState.markAllSeen}
        />
        <NotificationsView {...listState} />
      </div>
    </div>
  )
}
