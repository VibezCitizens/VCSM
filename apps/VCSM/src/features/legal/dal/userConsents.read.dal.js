import { supabase } from '@/services/supabase/supabaseClient'

const CONSENT_SELECT = [
  'id',
  'user_id',
  'legal_document_id',
  'consent_type',
  'consent_version',
  'accepted',
  'accepted_at',
  'revoked_at',
].join(', ')

/**
 * Fetch the user's latest consent records for a given app.
 * Returns all accepted (non-revoked) consent rows.
 */
export async function dalGetUserConsents({ userId, appId }) {
  const { data, error } = await supabase
    .schema('platform')
    .from('user_consents')
    .select(CONSENT_SELECT)
    .eq('user_id', userId)
    .eq('app_id', appId)
    .eq('accepted', true)
    .is('revoked_at', null)
    .order('accepted_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
