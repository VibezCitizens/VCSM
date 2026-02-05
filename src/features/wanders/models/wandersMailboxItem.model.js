// src/features/wanders/models/wandersMailboxItem.model.js
// ============================================================================
// WANDERS MODEL — MAILBOX ITEM
// Contract: map DB row (snake_case) -> UI-safe camelCase object.
// No side effects.
// ============================================================================

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  const s = value.trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * @param {any} row DB row from wanders.mailbox_items (often joined with cards)
 */
export function toWandersMailboxItem(row) {
  if (!row) return null;

  // Some DALs join cards; support common shapes:
  const card = row.card ?? row.cards ?? row.card_row ?? null;

  const cardCustomizationRaw =
    card?.customization ?? card?.customization_json ?? row?.customization ?? row?.customization_json ?? null;

  const customizationParsed = safeParseJson(cardCustomizationRaw) ?? cardCustomizationRaw ?? {};

  return {
    // mailbox_items fields
    id: row.id ?? null,
    cardId: row.card_id ?? row.cardId ?? null,

    ownerActorId: row.owner_actor_id ?? row.ownerActorId ?? null,
    ownerAnonId: row.owner_anon_id ?? row.ownerAnonId ?? null,

    ownerRole: row.owner_role ?? row.ownerRole ?? null,
    folder: row.folder ?? null,

    pinned: !!(row.pinned ?? false),
    archived: !!(row.archived ?? false),

    isRead: !!(row.is_read ?? row.isRead ?? false),
    readAt: row.read_at ?? row.readAt ?? null,

    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,

    // optional embedded card fields (if your DAL joined it)
    card: card
      ? {
          id: card.id ?? null,
          publicId: card.public_id ?? card.publicId ?? null,
          realmId: card.realm_id ?? card.realmId ?? null,

          status: card.status ?? null,
          sentAt: card.sent_at ?? card.sentAt ?? null,
          expiresAt: card.expires_at ?? card.expiresAt ?? null,

          senderActorId: card.sender_actor_id ?? card.senderActorId ?? null,
          senderAnonId: card.sender_anon_id ?? card.senderAnonId ?? null,
          recipientActorId: card.recipient_actor_id ?? card.recipientActorId ?? null,
          recipientAnonId: card.recipient_anon_id ?? card.recipientAnonId ?? null,

          recipientChannel: card.recipient_channel ?? card.recipientChannel ?? null,
          recipientEmail: card.recipient_email ?? card.recipientEmail ?? null,
          recipientPhone: card.recipient_phone ?? card.recipientPhone ?? null,

          isAnonymous: !!(card.is_anonymous ?? card.isAnonymous ?? false),

          messageText: card.message_text ?? card.messageText ?? null,
          messageCiphertext: card.message_ciphertext ?? card.messageCiphertext ?? null,
          messageNonce: card.message_nonce ?? card.messageNonce ?? null,
          messageAlg: card.message_alg ?? card.messageAlg ?? null,

          templateKey: card.template_key ?? card.templateKey ?? null,
          customization: customizationParsed && typeof customizationParsed === "object" ? customizationParsed : {},

          openedAt: card.opened_at ?? card.openedAt ?? null,
          lastOpenedAt: card.last_opened_at ?? card.lastOpenedAt ?? null,
          openCount: card.open_count ?? card.openCount ?? 0,

          senderClaimToken: card.sender_claim_token ?? card.senderClaimToken ?? null,
          recipientClaimToken: card.recipient_claim_token ?? card.recipientClaimToken ?? null,

          isVoid: !!(card.is_void ?? card.isVoid ?? false),
          inboxId: card.inbox_id ?? card.inboxId ?? null,

          createdAt: card.created_at ?? card.createdAt ?? null,
          updatedAt: card.updated_at ?? card.updatedAt ?? null,
        }
      : null,
  };
}

export default toWandersMailboxItem;
