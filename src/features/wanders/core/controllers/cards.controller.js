// src/features/wanders/core/controllers/cards.controller.js
// ============================================================================
// WANDERS CORE CONTROLLER — CARDS
// Meaning: read cards + mark opened counters (guest-auth identity = auth.users.id)
// ============================================================================

import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";

import {
  getWandersCardById as readCardByIdDAL,
  getWandersCardByPublicId as readCardByPublicIdDAL,
  listWandersCardsByInboxId as listByInboxDAL,
} from "@/features/wanders/core/dal/read/cards.read.dal";

import {
  updateWandersCard as updateCardDAL,
} from "@/features/wanders/core/dal/write/cards.write.dal";

// NOTE: If you have events core DAL later, you can plug it in here.
// import { createWandersCardEvent } from "@/features/wanders/core/dal/write/events.write.dal";

export async function readWandersCardById(input) {
  const row = await readCardByIdDAL({ cardId: input.cardId });
  return row ?? null;
}

export async function readWandersCardByPublicId(input) {
  const row = await readCardByPublicIdDAL({ publicId: input.publicId });
  return row ?? null;
}

export async function listCardsForInbox(input) {
  const rows = await listByInboxDAL({ inboxId: input.inboxId, limit: input.limit ?? 50 });
  return rows ?? [];
}

/**
 * Mark card as opened.
 * CORE meaning (user-based):
 * - increments open_count
 * - sets opened_at (first time) + last_opened_at
 *
 * IMPORTANT: This assumes your RLS allows public link open updates OR owner updates.
 */
export async function markWandersCardOpened(input) {
  const nowIso = new Date().toISOString();

  // Ensure auth user exists (anonymous sign-in) so auth.uid() is available for RLS.
  await ensureGuestUser();

  const current = await readCardByIdDAL({ cardId: input.cardId });
  if (!current) throw new Error("Card not found");

  const nextCount = (current.open_count ?? 0) + 1;

  const updated = await updateCardDAL({
    cardId: input.cardId,
    patch: {
      opened_at: current.opened_at ?? nowIso,
      last_opened_at: nowIso,
      open_count: nextCount,
    },
  });

  // Best-effort event hook (optional later)
  // try { await createWandersCardEvent({...}) } catch {}

  return updated ?? null;
}
