// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersCardKeys.controller.js
// ============================================================================
// WANDERS CONTROLLER — CARD KEYS
// ============================================================================

import {
  createWandersCardKey,
  getWandersCardKeyByCardId,
  updateWandersCardKey,
} from '@/features/wanders/dal/wandersCardKeys.dal'
import { toWandersCardKey } from '@/features/wanders/models/wandersCardKey.model'

/**
 * Upsert (create or update) card key for a card.
 * @param {{ cardId: string, wrappedKey: string, alg?: string }} input
 */
export async function upsertWandersCardKey(input) {
  const existing = await getWandersCardKeyByCardId(input.cardId)
  if (!existing) {
    const created = await createWandersCardKey({
      cardId: input.cardId,
      wrappedKey: input.wrappedKey,
      alg: input.alg ?? 'xchacha20poly1305',
    })
    return toWandersCardKey(created)
  }

  const updated = await updateWandersCardKey({
    cardId: input.cardId,
    wrappedKey: input.wrappedKey,
    alg: input.alg,
  })
  return toWandersCardKey(updated)
}

/**
 * Read key by card id.
 * @param {{ cardId: string }} input
 */
export async function readWandersCardKey(input) {
  const row = await getWandersCardKeyByCardId(input.cardId)
  return toWandersCardKey(row)
}
