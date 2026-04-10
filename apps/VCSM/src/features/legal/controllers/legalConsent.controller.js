import { dalGetActiveLegalDocuments } from '../dal/legalDocuments.read.dal'
import { dalGetUserConsents } from '../dal/userConsents.read.dal'
import { dalRecordLegalAcceptance } from '../dal/userConsents.write.dal'
import { getPublicIp } from '../dal/getPublicIp'
import { buildConsentComplianceStatus } from '../engine/legalCompliance.engine'
import { createTTLCache } from '@/shared/lib/ttlCache'

const VCSM_APP_KEY = 'vcsm'
const legalDocsCache = createTTLCache(300_000) // 5 minutes

/**
 * Fetch active legal documents for the VCSM app.
 * Cached for 5 minutes — legal docs change extremely rarely.
 * @returns {Promise<Array>} Active legal document rows.
 */
export async function getActiveLegalDocuments() {
  const cached = legalDocsCache.get(VCSM_APP_KEY)
  if (cached) return cached

  const docs = await dalGetActiveLegalDocuments({ appKey: VCSM_APP_KEY })
  legalDocsCache.set(VCSM_APP_KEY, docs)
  return docs
}

export function invalidateLegalDocsCache() {
  legalDocsCache.invalidateAll()
}

/**
 * Check whether the user has accepted all currently active legal documents.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<{ requiresConsent: boolean, pending: Array, accepted: Array }>}
 */
export async function getUserConsentStatus({ userId }) {
  const activeDocs = await dalGetActiveLegalDocuments({ appKey: VCSM_APP_KEY })
  if (activeDocs.length === 0) {
    return { requiresConsent: false, pending: [], accepted: [] }
  }

  const appId = activeDocs[0].app_id
  const consents = await dalGetUserConsents({ userId, appId })

  // Build a set of (document_type, version) the user has accepted
  const acceptedSet = new Set(
    consents.map((c) => `${c.consent_type}:${c.consent_version}`)
  )

  const pending = []
  const accepted = []

  for (const doc of activeDocs) {
    const key = `${doc.document_type}:${doc.version}`
    if (acceptedSet.has(key)) {
      accepted.push(doc)
    } else {
      pending.push(doc)
    }
  }

  return {
    requiresConsent: pending.length > 0,
    pending,
    accepted,
  }
}

/**
 * Record acceptance of multiple legal documents at once.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} params.userAppAccountId
 * @param {Array} params.documents - Array of legal document objects to accept
 * @param {string} params.acceptedVia - 'login_gate' | 'signup' | 'settings' | 'reconsent'
 */
export async function recordLegalAcceptance({
  userId,
  userAppAccountId,
  documents,
  acceptedVia,
}) {
  const locale = typeof navigator !== 'undefined' ? navigator.language : null
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null
  const ipAddress = await getPublicIp()

  const results = []
  for (const doc of documents) {
    const result = await dalRecordLegalAcceptance({
      userId,
      userAppAccountId,
      appId: doc.app_id,
      legalDocumentId: doc.id,
      consentType: doc.document_type,
      consentVersion: doc.version,
      acceptedVia,
      locale,
      userAgent,
      ipAddress,
    })
    results.push(result)
  }

  return results
}

/**
 * Record consent during signup flow.
 * Resolves active legal documents dynamically, then inserts acceptance rows.
 *
 * @param {Object} params
 * @param {string} params.userId - The newly created user's ID
 * @returns {Promise<Array>} Inserted consent rows
 * @throws If document resolution or consent insert fails
 */
export async function recordSignupConsent({ userId }) {
  const activeDocs = await dalGetActiveLegalDocuments({ appKey: VCSM_APP_KEY })
  if (activeDocs.length === 0) {
    console.warn('[LegalConsent] No active legal documents found during signup')
    return []
  }

  return recordLegalAcceptance({
    userId,
    userAppAccountId: null,
    documents: activeDocs,
    acceptedVia: 'signup',
  })
}

// ============================================================
// LEGAL GATE — Session-level compliance check
// ============================================================

/**
 * Resolve legal gate for the current session.
 * Fetches active docs + user consents, runs compliance engine, returns decision.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<{ decision: 'ALLOW_ACCESS'|'REQUIRE_RECONSENT', requiredActions: Array }>}
 */
export async function resolveLegalGateForSession({ userId }) {
  const activeDocs = await dalGetActiveLegalDocuments({ appKey: VCSM_APP_KEY })
  if (activeDocs.length === 0) {
    return { decision: 'ALLOW_ACCESS', requiredActions: [] }
  }

  const appId = activeDocs[0].app_id
  const consents = await dalGetUserConsents({ userId, appId })

  const status = buildConsentComplianceStatus({
    activeDocs,
    userConsents: consents,
  })

  if (status.isCompliant) {
    return { decision: 'ALLOW_ACCESS', requiredActions: [] }
  }

  return { decision: 'REQUIRE_RECONSENT', requiredActions: status.requiredActions }
}

// ============================================================
// RE-CONSENT — Accept required documents after version bump
// ============================================================

/**
 * Accept a set of required consent actions (re-consent flow).
 * Each action maps to a legal document that the user must accept.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} params.userAppAccountId
 * @param {Array} params.requiredActions - From buildConsentComplianceStatus().requiredActions
 * @returns {Promise<Array>} Inserted consent rows
 */
export async function acceptRequiredConsents({
  userId,
  userAppAccountId,
  requiredActions,
}) {
  // Convert requiredActions into the document shape that recordLegalAcceptance expects
  const documents = requiredActions.map((action) => ({
    id: action.legal_document_id,
    app_id: action.app_id,
    document_type: action.consent_type,
    version: action.required_version,
  }))

  return recordLegalAcceptance({
    userId,
    userAppAccountId: userAppAccountId ?? null,
    documents,
    acceptedVia: 'reconsent',
  })
}
