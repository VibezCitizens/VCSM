// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\controllers\getLovedropCard.controller.js
// ============================================================================
// LOVE DROP CONTROLLER — GET CARD
// Contract: owns meaning for public reads.
// ============================================================================

import { getLovedropCardByPublicId } from '@/season/lovedrop/dal/lovedropCards.dal'
import { lovedropCardFromRow } from '@/season/lovedrop/model/lovedropCard.model'

/**
 * Public-safe read by publicId (no open tracking).
 *
 * @param {{ publicId: string }} input
 */
export async function getLovedropCard(input) {
  const publicId = (input?.publicId ?? '').trim()
  if (!publicId) {
    const err = new Error('publicId is required')
    err.code = 'LOVEDROP_PUBLIC_ID_REQUIRED'
    throw err
  }

  const row = await getLovedropCardByPublicId(publicId)

  if (!row || row.is_void) {
    const err = new Error('Card not found')
    err.code = 'LOVEDROP_CARD_NOT_FOUND'
    throw err
  }

  return lovedropCardFromRow(row)
}
