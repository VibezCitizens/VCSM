// getOrCreateDirectConversation.controller.js
import { supabase } from '@/services/supabase/supabaseClient'

export async function getOrCreateDirectConversation({
  fromActorId,
  toActorId,
  realmId,
}) {
  if (!fromActorId) throw new Error('Missing fromActorId')
  if (!toActorId) throw new Error('Missing toActorId')
  if (!realmId) throw new Error('Missing realmId')
  if (fromActorId === toActorId) {
    throw new Error('Cannot DM self')
  }

  const { data: conversationId, error } = await supabase
    .schema('vc')
    .rpc('vc_get_or_create_one_to_one', {
      a1: fromActorId,
      a2: toActorId,
      p_realm_id: realmId,
    })

  if (error) throw error

  return { conversationId }
}
