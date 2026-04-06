import { supabase } from '@/services/supabase/supabaseClient';

export async function markNotificationRead(id, recipientActorId) {
  if (!id || !recipientActorId) return;

  await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_read: true, is_seen: true })
    .eq('id', id)
    .eq('recipient_actor_id', recipientActorId);
}

export async function markAllNotificationsSeenDAL(actorId) {
  if (!actorId) return;

  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true, is_read: true })
    .eq('recipient_actor_id', actorId)
    .eq('is_seen', false);

  if (error) throw error;
}
