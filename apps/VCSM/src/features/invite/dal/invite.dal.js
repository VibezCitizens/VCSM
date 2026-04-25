import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Sends a Vibez Citizens invite to the given email address.
 * Delegates to the send-citizen-invite Edge Function — service role key never leaves the server.
 *
 * @param {string} targetEmail - Email address to invite
 * @param {'citizen'|'vport'} inviterType - Whether inviting as a citizen or VPORT
 * @param {string|null} inviterActorId - Actor ID when inviterType is 'vport'
 * @returns {{ ok: boolean, code?: string }}
 */
export async function sendCitizenInviteDAL({ targetEmail, inviterType, inviterActorId = null }) {
  const { data, error } = await supabase.functions.invoke('send-citizen-invite', {
    method: 'POST',
    body: { targetEmail, inviterType, inviterActorId },
  })

  if (error) {
    throw new Error(error?.message || 'Invite request failed.')
  }

  return data
}
