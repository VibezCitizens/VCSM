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

  let s = value.trim();
  if (!s) return null;

  // Unwrap up to 2 layers:
  // - jsonb object -> returned as object
  // - jsonb stored as JSON string -> parse once yields object OR yields string
  // - double-encoded -> parse twice yields object
  for (let i = 0; i < 2; i++) {
    try {
      const parsed = JSON.parse(s);

      if (parsed && typeof parsed === "object") return parsed;

      if (typeof parsed === "string") {
        s = parsed.trim();
        if (!s) return null;
        continue;
      }

      return null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * @param {any} row DB row from wanders.mailbox_items (often joined with cards)
 */
export function toWandersMailboxItem(row) {
  if (!row) return null;

  const card = row.card ?? row.cards ?? row.card_row ?? null;

  // ✅ IMPORTANT: parse card.customization in all shapes
  const cardCustomizationRaw =
    card?.customization ??
    card?.customization_json ??
    card?.customizationJson ??
    null;

  const parsed = safeParseJson(cardCustomizationRaw);

  // Use parsed object if we got one, else if raw already object use it, else {}
  const customization =
    (parsed && typeof parsed === "object")
      ? parsed
      : (cardCustomizationRaw && typeof cardCustomizationRaw === "object")
      ? cardCustomizationRaw
      : {};

  const templateKey = card?.template_key ?? card?.templateKey ?? null;

  return {
    // mailbox_items fields
    id: row.id ?? null,
    cardId: row.card_id ?? row.cardId ?? null,

    ownerActorId: row.owner_actor_id ?? row.ownerActorId ?? null,
    ownerAnonId: row.owner_anon_id ?? row.ownerAnonId ?? null,
    ownerUserId: row.owner_user_id ?? row.ownerUserId ?? null,

    ownerRole: row.owner_role ?? row.ownerRole ?? null,
    folder: row.folder ?? null,

    pinned: !!(row.pinned ?? false),
    archived: !!(row.archived ?? false),

    isRead: !!(row.is_read ?? row.isRead ?? false),
    readAt: row.read_at ?? row.readAt ?? null,

    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,

    // embedded card
    card: card
      ? {
          id: card.id ?? null,
          publicId: card.public_id ?? card.publicId ?? null,
          realmId: card.realm_id ?? card.realmId ?? null,

          status: card.status ?? null,
          sentAt: card.sent_at ?? card.sentAt ?? null,
          expiresAt: card.expires_at ?? card.expiresAt ?? null,

          senderActorId: card.sender_actor_id ?? card.senderActorId ?? null,
          senderUserId: card.sender_user_id ?? card.senderUserId ?? null,
          recipientUserId: card.recipient_user_id ?? card.recipientUserId ?? null,

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

          templateKey,
          template_key: templateKey,

          // ✅ never drop keys like imageUrl/image_url
          customization,

          openedAt: card.opened_at ?? card.openedAt ?? null,
          lastOpenedAt: card.last_opened_at ?? card.lastOpenedAt ?? null,
          openCount: card.open_count ?? card.openCount ?? 0,

          isVoid: !!(card.is_void ?? card.isVoid ?? false),
          inboxId: card.inbox_id ?? card.inboxId ?? null,

          createdAt: card.created_at ?? card.createdAt ?? null,
          updatedAt: card.updated_at ?? card.updatedAt ?? null,
        }
      : null,
  };
}

export default toWandersMailboxItem;
