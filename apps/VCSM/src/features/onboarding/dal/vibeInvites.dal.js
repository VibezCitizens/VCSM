import { supabase } from '@/services/supabase/supabaseClient'

export async function readVibeInvitesDAL({ senderActorId, limit = 10 }) {
  if (!senderActorId) return []

  const cappedLimit = Math.max(1, Math.min(Number(limit) || 10, 50))

  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_invites')
    .select(`
      id,
      inviter_actor_id,
      invite_channel,
      invite_target,
      invite_code,
      status,
      accepted_actor_id,
      message,
      metadata,
      created_at,
      accepted_at,
      expires_at
    `)
    .eq('inviter_actor_id', senderActorId)
    .order('created_at', { ascending: false })
    .limit(cappedLimit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    sender_actor_id: row.inviter_actor_id,
    recipient_actor_id: row.accepted_actor_id,
    status: row.status,
    created_at: row.created_at,
    accepted_at: row.accepted_at,
    invite_channel: row.invite_channel,
    invite_target: row.invite_target,
    invite_code: row.invite_code,
    message: row.message,
    metadata: row.metadata,
    expires_at: row.expires_at,
  }))
}

export async function readVibeInviteCountDAL({ senderActorId }) {
  if (!senderActorId) return 0

  const { count, error } = await supabase
    .schema('vc')
    .from('vibe_invites')
    .select('id', { count: 'exact', head: true })
    .eq('inviter_actor_id', senderActorId)

  if (error) throw error
  return count ?? 0
}

export async function readQualifyingVibeInviteCountDAL({ senderActorId }) {
  if (!senderActorId) return 0

  const { count, error } = await supabase
    .schema('vc')
    .from('vibe_invites')
    .select('id', { count: 'exact', head: true })
    .eq('inviter_actor_id', senderActorId)
    .in('status', ['pending', 'accepted'])

  if (error) throw error
  return count ?? 0
}