// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim submission controller.
//
// Orchestrates: client-side validation → T2 RPC write → structured result.
// Creates a PENDING claim only. No ownership, no VPORT, no approval.

import { submitBusinessClaim } from '@/features/claim/dal/submitBusinessClaim.write.dal'
import { validateClaimForm, mapClaimError } from '@/features/claim/model/claim.model'

/**
 * @param {object} args
 * @param {object} args.form           the claim form state
 * @param {object} args.provider       { id, slug } of the target provider
 * @param {string|null} args.requesterActorId  caller-owned Citizen actor id
 * @param {string|null} [args.sourceUrl]       attribution (e.g. current href)
 * @returns {Promise<
 *   { ok: true, data: { claimId: string, claimStatus: string, providerId: string } }
 *   | { ok: false, code: string, message: string, fieldErrors?: Record<string,string> }
 * >}
 */
export async function submitClaimController({ form, provider, requesterActorId, sourceUrl = null }) {
  const { valid, errors } = validateClaimForm(form)
  if (!valid) {
    return {
      ok: false,
      code: 'VALIDATION_FAILED',
      message: 'Please fix the highlighted fields.',
      fieldErrors: errors,
    }
  }

  try {
    const data = await submitBusinessClaim({
      providerSlug: provider?.slug ?? null,
      providerId: provider?.id ?? null,
      ownerName: form.ownerName.trim(),
      role: form.role,
      contactMethod: form.contactMethod,
      email: form.contactMethod === 'email' ? form.email.trim() : (form.email?.trim() || null),
      phone: form.contactMethod === 'phone' ? form.phone.trim() : (form.phone?.trim() || null),
      verificationMethod: form.contactMethod,
      instagramUrl: form.instagramUrl?.trim() || null,
      websiteUrl: form.websiteUrl?.trim() || null,
      proofImageUrl: form.proofImageUrl?.trim() || null,
      notes: form.notes?.trim() || null,
      sourceUrl,
      requesterActorId: requesterActorId ?? null,
    })
    return { ok: true, data }
  } catch (error) {
    const { code, message } = mapClaimError(error)
    return { ok: false, code, message }
  }
}
