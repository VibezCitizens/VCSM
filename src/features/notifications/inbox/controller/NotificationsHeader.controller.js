import { countUnreadNotifications } from '../dal/notifications.count.dal'
import { supabase } from '@/services/supabase/supabaseClient'

export async function loadNotificationHeader(actorId) {
  return {
    unreadCount: await countUnreadNotifications(actorId),
  }
}

export async function markAllNotificationsSeen(actorId) {
  if (!actorId) return

  await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true, is_read: true })
    .eq('recipient_actor_id', actorId)
    .eq('is_seen', false)
}
