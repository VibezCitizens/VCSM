import { supabase } from '@/services/supabase/supabaseClient'

/**
 * DAL: getOrCreateDirectConversation
 * --------------------------------
 * RAW database access only.
 * No validation. No meaning. No rules.
 */
export async function getOrCreateDirectConversationRPC({
  fromActorId,
  toActorId,
  realmId,
}) {
  const { data, error } = await supabase
    .schema('vc')
    .rpc('vc_get_or_create_one_to_one', {
      a1: fromActorId,
      a2: toActorId,
      p_realm_id: realmId,
    })

  if (error) throw error

  return data // conversation_id (raw)
}
