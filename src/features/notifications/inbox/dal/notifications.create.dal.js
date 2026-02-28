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
}) {
  if (!recipientActorId || !kind) {
    throw new Error('dalInsertNotification: recipientActorId and kind are required')
  }

  const row = {
    recipient_actor_id: recipientActorId,
    actor_id: actorId,
    kind,
    object_type: objectType,
    object_id: objectId,
    link_path: linkPath,
    context: context && typeof context === 'object' ? context : {},
    is_read: false,
    is_seen: false,
  }

  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .insert(row)

  if (error) {
    // Some deployments create follow notifications in DB triggers/RPC.
    // In that setup direct client insert can be RLS-blocked (42501) and
    // should be treated as non-fatal to avoid breaking subscribe UX.
    const isFollowKind = FOLLOW_NOTIFICATION_KINDS.has(String(kind))
    const isRlsDenied = String(error?.code || '') === '42501'

    if (isFollowKind && isRlsDenied) {
      return false
    }

    throw error
  }

  return true
}
