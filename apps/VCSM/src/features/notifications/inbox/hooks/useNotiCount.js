// Thin wrapper — unread count is now managed by React Query in bootstrap.selectors.js.
// All manual polling, setInterval, and TTL cache logic has been removed.
import { useNotificationUnread } from '@/bootstrap/bootstrap.selectors'

export default function useNotiCount() {
  return useNotificationUnread()
}
