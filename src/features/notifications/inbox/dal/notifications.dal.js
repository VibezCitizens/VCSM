// src/features/notifications/dal/notifications.dal.js

import vc from '@/services/supabase/vcClient'

export async function dalMarkNotificationsSeen({
  actorId,
  notificationIds,
}) {
  if (!actorId || !notificationIds?.length) return

  await vc
    .from('notifications')
    .update({ is_seen: true })
    .eq('recipient_actor_id', actorId)
    .in('id', notificationIds)
}
