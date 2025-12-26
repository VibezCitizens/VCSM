import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Ensure the actor is an active member of a conversation(R).
 * Safe to call multiple times. (R)
 */
export async function ensureConversationMembership({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) return

  // Check if membership already exists
  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('actor_id, is_active')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) throw error

  // Already active → nothing to do
  if (data?.is_active) return

  // Exists but inactive → reactivate
  if (data && data.is_active === false) {
    await supabase
      .schema('vc')
      .from('conversation_members')
      .update({ is_active: true })
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)
    return
  }

  // Does not exist → insert
  await supabase
    .schema('vc')
    .from('conversation_members')
    .insert({
      conversation_id: conversationId,
      actor_id: actorId,
      role: 'member',
      is_active: true,
    })
}
