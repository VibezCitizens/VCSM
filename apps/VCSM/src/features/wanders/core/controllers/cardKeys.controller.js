// src/features/wanders/core/controllers/cardKeys.controller.js
// ============================================================================
// WANDERS CONTROLLER — CARD KEYS (CORE)
// Owns meaning: upsert/read a wrapped key for a card.
// ============================================================================

import { toWandersCardKey } from "@/features/wanders/models/wandersCardKey.model";

import { getWandersCardKeyByCardId } from "@/features/wanders/core/dal/read/cardKeys.read.dal";
import {
  createWandersCardKey,
  updateWandersCardKey,
} from "@/features/wanders/core/dal/write/cardKeys.write.dal";

/**
 * Upsert (create or update) card key for a card.
 * @param {{ cardId: string, wrappedKey: string, alg?: string }} input
 */
export async function upsertWandersCardKey(input) {
  const existing = await getWandersCardKeyByCardId({ cardId: input.cardId });

  if (!existing) {
    const created = await createWandersCardKey({
      cardId: input.cardId,
      wrappedKey: input.wrappedKey,
      alg: input.alg ?? "xchacha20poly1305",
    });
    return toWandersCardKey(created);
  }

  const updated = await updateWandersCardKey({
    cardId: input.cardId,
    wrappedKey: input.wrappedKey,
    alg: input.alg,
  });

  return toWandersCardKey(updated);
}

/**
 * Read key by card id.
 * @param {{ cardId: string }} input
 */
export async function readWandersCardKey(input) {
  const row = await getWandersCardKeyByCardId({ cardId: input.cardId });
  return toWandersCardKey(row);
}
