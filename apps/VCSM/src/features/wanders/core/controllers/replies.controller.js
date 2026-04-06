// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\controllers\replies.controller.js
// ============================================================================
// WANDERS CONTROLLER — REPLIES (Guest Auth) (CORE)
// Identity = auth.users.id (auth.uid() in RLS)
// Owns meaning: claim recipient on first interaction, create reply, emit events.
// ============================================================================

import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";

import {
  createWandersReply,
  updateWandersReply,
} from "@/features/wanders/core/dal/write/replies.write.dal";
import { listWandersRepliesByCardId } from "@/features/wanders/core/dal/read/replies.read.dal";

import { getWandersCardById } from "@/features/wanders/core/dal/read/cards.read.dal";
import { updateWandersCard } from "@/features/wanders/core/dal/write/cards.write.dal";
import { createWandersMailboxItem } from "@/features/wanders/core/dal/write/mailbox.write.dal";
import { createWandersCardEvent } from "@/features/wanders/core/dal/write/events.write.dal";

import { toWandersReply } from "@/features/wanders/models/wandersReply.model";

/**
 * Create reply as guest author (auth user).
 * Also claims recipient_user_id for link-shared cards on first interaction,
 * and seeds recipient mailbox + event.
 *
 * @param {{ cardId: string, body?: string|null, bodyCiphertext?: string|null, bodyNonce?: string|null, bodyAlg?: string }} input
 */
export async function createReplyAsAnon(input) {
  const user = await ensureGuestUser();

  const card = await getWandersCardById({ cardId: input.cardId });
  if (!card) throw new Error("Card not found");

  const senderUserId = card.sender_user_id ?? null;
  const recipientUserId = card.recipient_user_id ?? null;

  // Claim recipient for link card (only if current user isn't the sender)
  if (!recipientUserId && senderUserId && senderUserId !== user.id) {
    let updated = null;

    try {
      updated = await updateWandersCard({
        cardId: card.id,
        patch: {
          recipient_user_id: user.id,
          recipient_channel: card.recipient_channel ?? "link",
        },
      });
    } catch (e) {
      // claim is best-effort; do not block replies
      // (RLS will commonly throw here)
      console.warn("[replies.controller] recipient claim failed (continuing)", e);
      updated = null;
    }

    const effectiveCardId = updated?.id ?? card.id;

    // Seed recipient mailbox (best-effort)
    try {
      await createWandersMailboxItem({
        cardId: effectiveCardId,
        ownerActorId: null,
        ownerUserId: user.id,
        ownerRole: "recipient",
        folder: "inbox",
        isRead: false,
        readAt: null,
      });
    } catch (e) {
      console.warn("[replies.controller] seed recipient mailbox failed (continuing)", e);
    }

    // Event: recipient claimed (best-effort)
    try {
      await createWandersCardEvent({
        cardId: effectiveCardId,
        userId: user.id,
        actorId: null,
        eventType: "recipient_claimed",
        meta: {},
      });
    } catch (e) {
      console.warn("[replies.controller] recipient_claimed event failed (continuing)", e);
    }
  }

  // Create reply (this should be the only required write)
  const row = await createWandersReply({
    cardId: input.cardId,
    authorActorId: null,
    authorUserId: user.id,
    body: input.body ?? null,
    bodyCiphertext: input.bodyCiphertext ?? null,
    bodyNonce: input.bodyNonce ?? null,
    bodyAlg: input.bodyAlg ?? "xchacha20poly1305",
  });

  // Event: replied (best-effort)
  try {
    await createWandersCardEvent({
      cardId: input.cardId,
      userId: user.id,
      actorId: null,
      eventType: "replied",
      meta: { reply_id: row?.id ?? null },
    });
  } catch (e) {
    console.warn("[replies.controller] replied event failed (continuing)", e);
  }

  return toWandersReply(row);
}

/**
 * List replies by card id.
 * Viewer must be sender_user_id or recipient_user_id.
 *
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listRepliesForCard(input) {
  const user = await ensureGuestUser();

  const card = await getWandersCardById({ cardId: input.cardId });
  if (!card) throw new Error("Card not found");

  const isSender = !!card.sender_user_id && card.sender_user_id === user.id;
  const isRecipient = !!card.recipient_user_id && card.recipient_user_id === user.id;

  if (!isSender && !isRecipient) return [];

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
    deletedAt: (input.isDeleted ?? true) ? nowIso : null,
  });

  return toWandersReply(row);
}
