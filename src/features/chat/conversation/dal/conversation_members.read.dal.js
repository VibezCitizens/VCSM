import { supabase } from '@/services/supabase/supabaseClient'

export async function fetchConversationMember({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('actor_id, is_active')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) throw error

  return data // RAW DATA ONLY
}
