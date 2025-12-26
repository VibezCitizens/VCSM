import { supabase } from '@/services/supabase/supabaseClient';

export async function fetchNotificationsPage({
  recipientActorId,
  before,
  limit = 20,
}) {
  if (!recipientActorId) return [];

  let q = supabase
    .schema('vc')
    .from('notifications')
    .select(`
      id,
      recipient_actor_id,
      actor_id,
      kind,
      object_type,
      object_id,
      link_path,
      context,
      is_read,
      is_seen,
      created_at
    `)
    .eq('recipient_actor_id', recipientActorId)
    .order('created_at', { ascending: false })
    .limit(limit + (before ? 1 : 0));

  if (before) q = q.lt('created_at', before);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
