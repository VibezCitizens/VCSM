// engines/chat/src/dal/getOrCreateDirectConversation.rpc.js
// ============================================================
// Get or Create Direct Conversation — RPC DAL
// ------------------------------------------------------------
// Calls the chat.get_or_create_direct_conversation SECURITY DEFINER
// function. This atomically:
//   1. Validates auth + inputs
//   2. Deduplicates direct pairs (sorted actor key)
//   3. Creates conversation + members + inbox if new
//   4. Returns existing conversation id if already exists
//
// No client-side INSERT into chat.conversations.
// ============================================================

import { getSupabaseClient } from '../config.js'

export async function getOrCreateDirectConversationRPC({
  fromActorId,
  toActorId,
  realmId,
}) {
  if (!fromActorId || !toActorId || !realmId) {
    throw new Error('[getOrCreateDirectConversationRPC] missing params')
  }

  console.log('[getOrCreateDirectConversation] START', {
    fromActorId,
    toActorId,
    realmId,
  })

  const supabase = getSupabaseClient()

  const { data, error } = await supabase.schema('chat').rpc(
    'get_or_create_direct_conversation',
    {
      p_from_actor_id: fromActorId,
      p_to_actor_id: toActorId,
      p_realm_id: realmId,
    }
  )

  console.log('[getOrCreateDirectConversation] RPC RESULT', {
    fromActorId,
    toActorId,
    realmId,
    data,
    error,
  })

  if (error) {
    console.error('[getOrCreateDirectConversationRPC] rpc failed', error)
    throw error
  }

  if (!data) {
    throw new Error('[getOrCreateDirectConversationRPC] no conversation id returned')
  }

  return data
}
