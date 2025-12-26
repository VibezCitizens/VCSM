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
