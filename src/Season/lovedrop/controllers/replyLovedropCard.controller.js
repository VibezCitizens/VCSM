// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\controllers\replyLovedropCard.controller.js
// ============================================================================
// LOVE DROP CONTROLLER — REPLY TO CARD
// Contract: owns meaning + validation for replying.
// ============================================================================
import { getLovedropCardByPublicId } from '@/season/lovedrop/dal/lovedropCards.dal'
import { createLovedropReply } from '@/season/lovedrop/dal/lovedropReplies.dal'
import { insertLovedropCardEvent } from '@/season/lovedrop/dal/lovedropEvents.dal'

function safeTrim(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

/**
 * Reply to a LoveDrop card by publicId.
 *
 * @param {{
 *  publicId: string,
 *  authorActorId?: string|null,
 *  authorAnonId?: string|null,
 *  body: string,
 *  meta?: object
 * }} input
 */
export async function replyLovedropCard(input) {
  const publicId = safeTrim(input?.publicId)
  if (!publicId) {
    const err = new Error('publicId is required')
    err.code = 'LOVEDROP_PUBLIC_ID_REQUIRED'
    throw err
  }

  const body = safeTrim(input?.body)
  if (!body) {
    const err = new Error('body is required')
    err.code = 'LOVEDROP_REPLY_BODY_REQUIRED'
    throw err
  }

  const authorActorId = input?.authorActorId ?? null
  const authorAnonId = input?.authorAnonId ?? null

  if (!authorActorId && !authorAnonId) {
    const err = new Error('author identity required (actorId or anonId)')
    err.code = 'LOVEDROP_REPLY_AUTHOR_ID_REQUIRED'
    throw err
  }

  const cardRow = await getLovedropCardByPublicId(publicId)
  if (!cardRow || cardRow.is_void) {
    const err = new Error('Card not found')
    err.code = 'LOVEDROP_CARD_NOT_FOUND'
    throw err
  }

  // Create reply
  const replyRow = await createLovedropReply({
    cardId: cardRow.id,
    authorActorId,
    authorAnonId,
    body,
  })

  // Log event
  await insertLovedropCardEvent({
    cardId: cardRow.id,
    actorId: authorActorId,
    anonId: authorAnonId,
    eventType: 'replied',
    meta: input?.meta ?? {},
  })

  return { reply: replyRow }
}
