/**
 * Legal Compliance Engine — Pure comparison logic.
 *
 * Compares active legal documents against user's latest accepted consents
 * and determines whether the user is compliant or needs to re-consent.
 *
 * This module is pure and testable — no side effects, no DB calls.
 */

/**
 * Build compliance status by comparing active docs vs user consents.
 *
 * @param {Object} params
 * @param {Array} params.activeDocs - Active legal documents from platform.legal_documents
 * @param {Array} params.userConsents - User's accepted (non-revoked) consent rows
 * @returns {{ isCompliant: boolean, missingTypes: string[], outdatedTypes: string[], requiredActions: Array }}
 */
export function buildConsentComplianceStatus({ activeDocs, userConsents }) {
  if (!activeDocs || activeDocs.length === 0) {
    return { isCompliant: true, missingTypes: [], outdatedTypes: [], requiredActions: [] }
  }

  // Index user consents by consent_type → latest accepted row
  const consentByType = {}
  for (const consent of userConsents) {
    const existing = consentByType[consent.consent_type]
    // Keep the most recently accepted row per type
    if (!existing || new Date(consent.accepted_at) > new Date(existing.accepted_at)) {
      consentByType[consent.consent_type] = consent
    }
  }

  const missingTypes = []
  const outdatedTypes = []
  const requiredActions = []

  for (const doc of activeDocs) {
    const userConsent = consentByType[doc.document_type]

    if (!userConsent) {
      // No consent record at all for this document type
      missingTypes.push(doc.document_type)
      requiredActions.push(buildRequiredAction(doc, null))
      continue
    }

    if (userConsent.revoked_at) {
      // Consent was revoked — treat as missing
      missingTypes.push(doc.document_type)
      requiredActions.push(buildRequiredAction(doc, userConsent.consent_version))
      continue
    }

    if (userConsent.consent_version !== doc.version) {
      // Version mismatch — user accepted an older version
      outdatedTypes.push(doc.document_type)
      requiredActions.push(buildRequiredAction(doc, userConsent.consent_version))
      continue
    }

    if (userConsent.legal_document_id !== doc.id) {
      // Same version string but different document ID — treat as outdated
      outdatedTypes.push(doc.document_type)
      requiredActions.push(buildRequiredAction(doc, userConsent.consent_version))
      continue
    }

    // Consent is current — no action needed
  }

  return {
    isCompliant: requiredActions.length === 0,
    missingTypes,
    outdatedTypes,
    requiredActions,
  }
}

/**
 * Build a normalized required action object for a document.
 *
 * @param {Object} doc - Active legal document row
 * @param {string|null} currentVersion - User's currently accepted version (null if missing)
 * @returns {Object} Normalized required action
 */
function buildRequiredAction(doc, currentVersion) {
  return {
    consent_type: doc.document_type,
    legal_document_id: doc.id,
    app_id: doc.app_id,
    required_version: doc.version,
    current_version: currentVersion,
    content_url: doc.content_url,
    title: doc.title,
  }
}
