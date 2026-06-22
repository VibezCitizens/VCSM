import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Record a user's acceptance of a legal document.
 * accepted_at is intentionally omitted — DB DEFAULT now() provides server-authoritative time.
 * ip_address is intentionally omitted — must be captured server-side, not from the client.
 *
 * @param {Object} params
 * @param {string} params.userId - auth.users.id
 * @param {string|null} params.userAppAccountId - platform.user_app_accounts.id (nullable)
 * @param {string} params.appId - platform.apps.id
 * @param {string} params.legalDocumentId - platform.legal_documents.id
 * @param {string} params.consentType - e.g. 'privacy_policy', 'terms_of_service', 'age_verification'
 * @param {string} params.consentVersion - e.g. '1.0'
 * @param {string} params.acceptedVia - e.g. 'signup', 'reconsent'
 * @param {string|null} params.locale - informational only
 * @param {string|null} params.userAgent - informational only
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
      accepted_via: acceptedVia,
      locale: locale ?? null,
      user_agent: userAgent ?? null,
    })
    // Idempotent guard — silently ignores duplicate (user_id, legal_document_id,
    // consent_version) rows. Activates fully once DB-LEGAL-002 UNIQUE constraint lands;
    // safe to call now — onConflict is a no-op until the constraint exists.
    .onConflict('user_id, legal_document_id, consent_version')
    .ignoreDuplicates()
    .select('id, accepted_at')
    .maybeSingle()

  if (error) throw error
  return data
}
