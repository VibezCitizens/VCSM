// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\controllers\openLovedropCard.controller.js
// ============================================================================
// LOVE DROP CONTROLLER — OPEN CARD
// Contract: owns meaning + idempotency rules for "open" action.
// ============================================================================

import { getLovedropCardByPublicId, recordLovedropOpenAtomic } from '@/season/lovedrop/dal/lovedropCards.dal'
import { lovedropCardFromRow } from '@/season/lovedrop/model/lovedropCard.model'

/**
 * Open a LoveDrop card by publicId.
 *
 * Rules (controller-owned):
 * - Card must exist and not be void.
 * - If expired/revoked, we still may allow viewing (your choice). Here: allow viewing but still log opened only if not revoked/expired.
 * - Updates summary counters on the card.
 * - For anon viewers, uses DB RPC which is atomic and also inserts the opened event DB-side.
 *
 * @param {{
 *   publicId: string,
 *   viewerActorId?: string|null,
 *   viewerAnonId?: string|null,
 *   meta?: object
 * }} input
 */
export async function openLovedropCard(input) {
  const publicId = (input.publicId ?? '').trim()
  if (!publicId) {
    const err = new Error('publicId is required')
    err.code = 'LOVEDROP_PUBLIC_ID_REQUIRED'
    throw err
  }

  const viewerActorId = input.viewerActorId ?? null
  const viewerAnonId = input.viewerAnonId ?? null

  if (!viewerActorId && !viewerAnonId) {
    const err = new Error('viewer identity required (actorId or anonId)')
    err.code = 'LOVEDROP_VIEWER_ID_REQUIRED'
    throw err
  }

  const cardRow = await getLovedropCardByPublicId(publicId)
  if (!cardRow || cardRow.is_void) {
    const err = new Error('Card not found')
    err.code = 'LOVEDROP_CARD_NOT_FOUND'
    throw err
  }

  // ✅ Do not count opens from the sender themselves
  const isSender =
    (!!viewerActorId && !!cardRow.sender_actor_id && viewerActorId === cardRow.sender_actor_id) ||
    (!!viewerAnonId && !!cardRow.sender_anon_id && viewerAnonId === cardRow.sender_anon_id)

  const isCountable =
    !isSender && cardRow.status !== 'revoked' && cardRow.status !== 'expired'

  if (isCountable) {
    // ✅ Atomic + concurrency-safe + event insert happens inside the RPC
    if (viewerAnonId) {
      await recordLovedropOpenAtomic({
        publicId,
        anonId: viewerAnonId,
      })

      // Re-read for latest counters / timestamps
      const refreshedRow = await getLovedropCardByPublicId(publicId)

      return {
        card: lovedropCardFromRow(refreshedRow ?? cardRow),
        didCountOpen: true,
      }
    }

    // Actor-only viewers: your current DB RPC doesn't support actor_id.
    // Still allow viewing (no mutation).
    return {
      card: lovedropCardFromRow(cardRow),
      didCountOpen: false,
    }
  }

  return {
    card: lovedropCardFromRow(cardRow),
    didCountOpen: false,
  }
}

export default openLovedropCard
