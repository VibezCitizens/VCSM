import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Record a user's acceptance of a legal document.
 *
 * @param {Object} params
 * @param {string} params.userId - auth.users.id
 * @param {string|null} params.userAppAccountId - platform.user_app_accounts.id (nullable)
 * @param {string} params.appId - platform.apps.id
 * @param {string} params.legalDocumentId - platform.legal_documents.id
 * @param {string} params.consentType - e.g. 'privacy_policy', 'terms_of_service'
 * @param {string} params.consentVersion - e.g. '1.0'
 * @param {string} params.acceptedVia - e.g. 'login_gate', 'signup', 'settings'
 * @param {string|null} params.locale
 * @param {string|null} params.userAgent
 * @param {string|null} params.ipAddress
 */
export async function dalRecordLegalAcceptance({
  userId,
  userAppAccountId,
  appId,
  legalDocumentId,
  consentType,
  consentVersion,
  acceptedVia,
  locale,
  userAgent,
  ipAddress,
}) {
  const { data, error } = await supabase
    .schema('platform')
    .from('user_consents')
    .insert({
      user_id: userId,
      user_app_account_id: userAppAccountId ?? null,
      app_id: appId,
      legal_document_id: legalDocumentId,
      consent_type: consentType,
      consent_version: consentVersion,
      accepted: true,
      accepted_at: new Date().toISOString(),
      accepted_via: acceptedVia,
      locale: locale ?? null,
      user_agent: userAgent ?? null,
      ip_address: ipAddress ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
