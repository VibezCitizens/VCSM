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
export async function dalGetUserConsents({ userId, appId, consentTypes }) {
  let query = supabase
    .schema('platform')
    .from('user_consents')
    .select(CONSENT_SELECT)
    .eq('user_id', userId)
    .eq('app_id', appId)
    .eq('accepted', true)
    .is('revoked_at', null)
    .order('accepted_at', { ascending: false })
    .limit(20)

  // Filter to known active consent types — prevents flooded unknown-type rows from
  // displacing real consent entries within the limit window (ELEK-2026-06-06-003)
  if (consentTypes?.length) {
    query = query.in('consent_type', consentTypes)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
