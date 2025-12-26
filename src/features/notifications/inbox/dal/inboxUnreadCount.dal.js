// inboxUnreadCount.dal.js
import { supabase } from '@/services/supabase/supabaseClient';

export async function fetchInboxUnreadCounts(actorId) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .select('unread_count')
    .eq('actor_id', actorId);

  if (error) throw error;
  return data ?? [];
}
