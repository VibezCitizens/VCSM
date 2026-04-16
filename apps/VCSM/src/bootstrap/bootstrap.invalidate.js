// ============================================================
// Bootstrap Invalidation
// Call these from write paths that change unread state.
// Each function forces a re-fetch of the relevant count
// for the currently hydrated actorId.
// ============================================================

import { useBootstrapStore } from './bootstrap.store'
import { loadNotificationUnread, loadChatUnread } from './bootstrap.hydrate.controller'

/** Force re-fetch of the notification unread count. */
export function invalidateNotificationUnread() {
  const { hydratedForActorId } = useBootstrapStore.getState()
  if (hydratedForActorId) loadNotificationUnread(hydratedForActorId)
}

/** Force re-fetch of the chat unread count. */
export function invalidateChatUnread() {
  const { hydratedForActorId } = useBootstrapStore.getState()
  if (hydratedForActorId) loadChatUnread(hydratedForActorId)
}

/** Reset all bootstrap state. Call on logout or actor switch. */
export function invalidateBootstrap() {
  useBootstrapStore.getState().reset()
}
