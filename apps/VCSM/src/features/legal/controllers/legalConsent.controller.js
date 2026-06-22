import { dalGetActiveLegalDocuments } from '../dal/legalDocuments.read.dal'
import { dalGetUserConsents } from '../dal/userConsents.read.dal'
import { dalRecordLegalAcceptance } from '../dal/userConsents.write.dal'
import { buildConsentComplianceStatus } from '../engine/legalCompliance.engine'
import { createTTLCache } from '@/shared/lib/ttlCache'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'

const VCSM_APP_KEY = 'vcsm'

// Reduced from 5 min to 60 s — limits non-enforcement window after a version bump
const legalDocsCache = createTTLCache(60_000)
const consentCache = createTTLCache(90_000)

/**
 * Fetch active legal documents for the VCSM app.
 * Only caches non-empty results — empty docs must not be treated as compliant.
 */
export async function getActiveLegalDocuments() {
  const cached = legalDocsCache.get(VCSM_APP_KEY)
  if (cached) return cached

  const docs = await dalGetActiveLegalDocuments({ appKey: VCSM_APP_KEY })
  if (docs.length > 0) {
    legalDocsCache.set(VCSM_APP_KEY, docs)
  }
  return docs
}

export function invalidateLegalDocsCache() {
  legalDocsCache.invalidateAll()
}

/**
 * Invalidate the consent cache for a specific user+app pair (call after recording new consents).
 * If userId+appId are provided, invalidates only the matching entry.
 * If either is missing, clears the entire consent cache as a safe fallback.
 */
export function invalidateConsentCache(userId, appId) {
  if (userId && appId) consentCache.invalidate(`${userId}:${appId}`)
  else consentCache.invalidateAll()
}

/**
 * Fetch user consents with a 90-second TTL cache.
 * Cache key includes appId to prevent cross-app collision.
 */
async function getCachedUserConsents({ userId, appId, consentTypes }) {
  const cacheKey = `${userId}:${appId}`
  const cached = consentCache.get(cacheKey)
  if (cached) return cached

  const consents = await dalGetUserConsents({ userId, appId, consentTypes })
  consentCache.set(cacheKey, consents)
  return consents
}

/**
 * Check whether the user has accepted all currently active legal documents.
 */
export async function getUserConsentStatus({ userId }) {
  const activeDocs = await getActiveLegalDocuments()
  if (activeDocs.length === 0) {
    return { requiresConsent: false, pending: [], accepted: [] }
  }

  const appId = activeDocs[0].app_id
  const consentTypes = activeDocs.map((d) => d.document_type)
  const consents = await getCachedUserConsents({ userId, appId, consentTypes })

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

  return { requiresConsent: pending.length > 0, pending, accepted }
}

/**
 * Record acceptance of multiple legal documents at once.
 * IP address is intentionally omitted — must be captured server-side (Carnage task).
 * accepted_at is omitted so the DB DEFAULT now() applies (server-authoritative time).
 * locale and user_agent are informational only and not used as legal evidence.
 * Inserts are parallelized via Promise.all.
 */
export async function recordLegalAcceptance({
  userId,
  userAppAccountId,
  documents,
  acceptedVia,
}) {
  const user = await readCurrentAuthUser()
  if (!user || user.id !== userId) {
    throw new Error('recordLegalAcceptance: userId must match authenticated session')
  }

  const locale = typeof navigator !== 'undefined' ? navigator.language : null
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

  const results = await Promise.all(
    documents.map((doc) =>
      dalRecordLegalAcceptance({
        userId,
        userAppAccountId,
        appId: doc.app_id,
        legalDocumentId: doc.id,
        consentType: doc.document_type,
        consentVersion: doc.version,
        acceptedVia,
        locale,
        userAgent,
      })
    )
  )

  // Pass the appId from the first document so the cache key matches the stored entry.
  // All documents in a single acceptance batch share the same app_id.
  const appId = documents[0]?.app_id ?? null
  invalidateConsentCache(userId, appId)

  return results
}

/**
 * Record consent during signup flow.
 * Resolves active legal documents dynamically, then inserts acceptance rows.
 */
export async function recordSignupConsent({ userId }) {
  const activeDocs = await getActiveLegalDocuments()
  if (activeDocs.length === 0) {
    if (import.meta.env.DEV) {
      console.warn('[LegalConsent] No active legal documents found during signup')
    }
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
 * Throws if active documents cannot be loaded or are empty —
 * callers must handle errors by failing closed (blocking gate entry).
 */
export async function resolveLegalGateForSession({ userId }) {
  const activeDocs = await getActiveLegalDocuments()

  // Empty docs is a platform configuration error — not a compliant state.
  // Throw so the hook fails closed and surfaces a recoverable error UI.
  if (activeDocs.length === 0) {
    throw new Error('No active legal documents configured. Platform setup required.')
  }

  const appId = activeDocs[0].app_id
  const consentTypes = activeDocs.map((d) => d.document_type)
  const consents = await getCachedUserConsents({ userId, appId, consentTypes })

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
 */
export async function acceptRequiredConsents({
  userId,
  userAppAccountId,
  requiredActions,
}) {
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
