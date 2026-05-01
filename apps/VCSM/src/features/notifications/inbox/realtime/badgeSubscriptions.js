const noopUnsubscribe = () => {}

export function subscribeInboxBadge() {
  // Chat badge realtime is disabled for now. React Query polling/refetch owns freshness.
  return noopUnsubscribe
}

export function subscribeNotificationBadge() {
  // Notification badge realtime is disabled for now. React Query polling/refetch owns freshness.
  return noopUnsubscribe
}
