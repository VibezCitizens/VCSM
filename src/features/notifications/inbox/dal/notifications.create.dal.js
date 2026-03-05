// src/features/notifications/inbox/dal/notifications.create.dal.js
import { supabase } from '@/services/supabase/supabaseClient'

const FOLLOW_NOTIFICATION_KINDS = new Set([
  'follow',
  'follow_request',
  'follow_request_accepted',
])

export async function dalInsertNotification({
  recipientActorId,
  actorId = null,
  kind,
  objectType = null,
  objectId = null,
  linkPath = null,
  context = {},
  // ✅ NEW: actor the caller owns (authz), defaults to actorId
  asActorId = null,
}) {
  if (!recipientActorId || !kind) {
    throw new Error('dalInsertNotification: recipientActorId and kind are required')
  }

  const safeContext = context && typeof context === 'object' ? context : {}

  const { data: rpcId, error: rpcError } = await supabase
    .schema('vc')
    .rpc('create_notification', {
      p_recipient: recipientActorId,
      p_actor: actorId,
      p_kind: kind,
      p_object_type: objectType,
      p_object_id: objectId,
      p_ref_type: null,
      p_ref_id: null,
      p_link_path: linkPath,
      p_context: safeContext,
      p_skip_if_self: true,
      // ✅ works after DB function update
      p_as_actor: asActorId,
    })

  if (!rpcError) {
    return true
  }

  const msg = String(rpcError?.message || '')
  const code = String(rpcError?.code || '')

  const rpcMissing =
    msg.toLowerCase().includes('could not find the function') ||
    (msg.toLowerCase().includes('function') && msg.toLowerCase().includes('does not exist')) ||
    msg.toLowerCase().includes('not found')

  const isFollowKind = FOLLOW_NOTIFICATION_KINDS.has(String(kind))
  const isRlsDenied = code === '42501'

  if (isFollowKind && isRlsDenied) {
    return false
  }

  if (rpcMissing) {
    const row = {
      recipient_actor_id: recipientActorId,
      actor_id: actorId,
      kind,
      object_type: objectType,
      object_id: objectId,
      link_path: linkPath,
      context: safeContext,
      is_read: false,
      is_seen: false,
    }

    const { error } = await supabase
      .schema('vc')
      .from('notifications')
      .insert(row)

    if (error) {
      const insertRlsDenied = String(error?.code || '') === '42501'
      if (isFollowKind && insertRlsDenied) return false
      throw error
    }

    return true
  }

  throw rpcError
}