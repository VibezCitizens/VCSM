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
    <div className="module-modern-page flex h-full min-h-0 flex-col">
      <div className="module-modern-shell mx-auto w-full max-w-2xl flex-1 min-h-0 rounded-2xl">
        <NotificationsHeader
          unreadCount={headerState.unreadCount}
          onMarkAllSeen={headerState.markAllSeen}
        />

        <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <NotificationsView {...listState} />
        </div>
      </div>
    </div>
  )
}
