// src/season/lovedrop/controllers/listMyLovedrops.controller.js
import {
  listLovedropOutboxWithCardsByAnonId,
  listLovedropOutboxWithCardsByActorId,
} from '@/season/lovedrop/dal/lovedropOutbox.dal'
import { lovedropCardFromRow } from '@/season/lovedrop/model/lovedropCard.model'

export async function listMyLovedrops({ ownerActorId = null, ownerAnonId = null, limit = 100 }) {
  if (!ownerActorId && !ownerAnonId) {
    const err = new Error('owner identity required (actorId or anonId)')
    err.code = 'LOVEDROP_OWNER_ID_REQUIRED'
    throw err
  }

  const rows = ownerActorId
    ? await listLovedropOutboxWithCardsByActorId({ ownerActorId, limit })
    : await listLovedropOutboxWithCardsByAnonId({ ownerAnonId, limit })

  // Normalize to: { outboxId, createdAt, card }
  return (rows || [])
    .map((r) => {
      const cardRow = r?.card ?? null
      if (!cardRow || cardRow.is_void) return null
      return {
        outboxId: r.id,
        outboxCreatedAt: r.created_at,
        card: lovedropCardFromRow(cardRow),
      }
    })
    .filter(Boolean)
}
