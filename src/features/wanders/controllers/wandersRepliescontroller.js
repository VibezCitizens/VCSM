// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersReplies.controller.js
// ============================================================================
// WANDERS CONTROLLER — REPLIES
// ============================================================================

import {
  createWandersReply,
  listWandersRepliesByCardId,
  updateWandersReply,
} from "@/features/wanders/dal/wandersReplies.dal";
import { createWandersCardEvent } from "@/features/wanders/dal/wandersEvents.dal";
import { ensureWandersAnonIdentity } from "@/features/wanders/controllers/ensureWandersAnoncontroller";
import { toWandersReply } from "@/features/wanders/models/wandersReply.model";

import { getWandersCardById, updateWandersCard } from "@/features/wanders/dal/wandersCards.dal";
import { createWandersMailboxItem } from "@/features/wanders/dal/wandersMailbox.dal";

/**
 * Create reply as anon author.
 * Also ensures the replier is attached as recipient on first interaction
 * for link-shared cards (so the card becomes a 2-party channel).
 *
 * @param {{ cardId: string, body?: string|null, bodyCiphertext?: string|null, bodyNonce?: string|null, bodyAlg?: string }} input
 */
export async function createReplyAsAnon(input) {
  const anon = await ensureWandersAnonIdentity({ touch: true });

  const card = await getWandersCardById(input.cardId);
  if (!card) throw new Error("Card not found");

  // If this is a link-shared card with no recipient yet,
  // attach the current anon as recipient (unless they are the sender).
  if (!card.recipient_anon_id && card.sender_anon_id && card.sender_anon_id !== anon.id) {
    const updated = await updateWandersCard({
      cardId: card.id,
      patch: {
        recipient_anon_id: anon.id,
        recipient_channel: card.recipient_channel ?? "link",
      },
    });

    // Create recipient mailbox (so they can see the thread in their inbox)
    await createWandersMailboxItem({
      cardId: updated.id,
      ownerAnonId: anon.id,
      ownerActorId: null,
      ownerRole: "recipient",
      folder: "inbox",
    });

    await createWandersCardEvent({
      cardId: updated.id,
      anonId: anon.id,
      actorId: null,
      eventType: "recipient_claimed",
      meta: {},
    });
  }

  const row = await createWandersReply({
    cardId: input.cardId,
    authorActorId: null,
    authorAnonId: anon.id,
    body: input.body ?? null,
    bodyCiphertext: input.bodyCiphertext ?? null,
    bodyNonce: input.bodyNonce ?? null,
    bodyAlg: input.bodyAlg ?? "xchacha20poly1305",
  });

  await createWandersCardEvent({
    cardId: input.cardId,
    anonId: anon.id,
    actorId: null,
    eventType: "replied",
    meta: {},
  });

  return toWandersReply(row);
}

/**
 * List replies by card id.
 * ✅ MUST ensure anon identity so RLS has a viewer context.
 * Also (optional) enforce that viewer is sender or recipient once attached.
 *
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listRepliesForCard(input) {
  const anon = await ensureWandersAnonIdentity({ touch: true });

  // Optional hard guard (recommended):
  // If your RLS is strict, this prevents “empty list confusion” and enforces your intent.
  // If you *want* sender to see replies, sender_anon_id must be allowed.
  const card = await getWandersCardById(input.cardId);
  if (!card) throw new Error("Card not found");

  const isSender = !!card.sender_anon_id && card.sender_anon_id === anon.id;
  const isRecipient = !!card.recipient_anon_id && card.recipient_anon_id === anon.id;

  // If recipient not yet attached (link card), you can decide:
  // - Allow sender to see none until a recipient claims (current behavior is fine), OR
  // - Allow sender to see once replies exist.
  // Here we allow sender always, and allow recipient only if attached or they are replying (handled on create).
  if (!isSender && !isRecipient) {
    // If you want “public viewers” to see replies, remove this.
    // Keeping this prevents random anon from fetching replies for any card_id.
    return [];
  }

  const rows = await listWandersRepliesByCardId({
    cardId: input.cardId,
    limit: input.limit ?? 200,
  });

  return (rows || []).map(toWandersReply);
}

/**
 * Soft-delete reply.
 * @param {{ replyId: string, isDeleted?: boolean }} input
 */
export async function softDeleteReply(input) {
  const nowIso = new Date().toISOString();
  const row = await updateWandersReply({
    replyId: input.replyId,
    isDeleted: input.isDeleted ?? true,
    deletedAt: input.isDeleted ?? true ? nowIso : null,
  });
  return toWandersReply(row);
}
