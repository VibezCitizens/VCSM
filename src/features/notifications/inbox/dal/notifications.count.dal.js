import { supabase } from '@/services/supabase/supabaseClient'

export async function countUnreadNotifications(recipientActorId) {
  if (!recipientActorId) return 0

  const { count, error } = await supabase
    .schema('vc')
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_actor_id', recipientActorId)
    .eq('is_seen', false)

  if (error) throw error
  return count ?? 0
}
