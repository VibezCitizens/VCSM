// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersMailboxItem.model.js
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

  // Some DALs join cards; support common shapes:
  const cardRow = row.card ?? row.cards ?? row.card_row ?? null;

  // ✅ IMPORTANT: preserve full customization (do NOT rebuild/allowlist)
  const customizationRaw =
    cardRow?.customization ??
    cardRow?.customization_json ??
    cardRow?.customizationJson ??
    row?.customization ?? // (only if your DAL ever flattens it)
    row?.customization_json ??
    null;

  const customizationParsed = safeParseJson(customizationRaw);
  const customization =
    (customizationParsed && typeof customizationParsed === "object")
      ? customizationParsed
      : (customizationRaw && typeof customizationRaw === "object")
      ? customizationRaw
      : {};

  const card = cardRow
    ? {
        id: cardRow.id,
        publicId: cardRow.public_id ?? cardRow.publicId,
        realmId: cardRow.realm_id ?? cardRow.realmId,
        inboxId: cardRow.inbox_id ?? cardRow.inboxId,
        dropLinkId: cardRow.drop_link_id ?? cardRow.dropLinkId,

        status: cardRow.status,
        sentAt: cardRow.sent_at ?? cardRow.sentAt,
        expiresAt: cardRow.expires_at ?? cardRow.expiresAt,

        senderActorId: cardRow.sender_actor_id ?? cardRow.senderActorId,
        senderUserId: cardRow.sender_user_id ?? cardRow.senderUserId,
        senderAnonId: cardRow.sender_anon_id ?? cardRow.senderAnonId,

        recipientActorId: cardRow.recipient_actor_id ?? cardRow.recipientActorId,
        recipientUserId: cardRow.recipient_user_id ?? cardRow.recipientUserId,
        recipientAnonId: cardRow.recipient_anon_id ?? cardRow.recipientAnonId,

        recipientChannel: cardRow.recipient_channel ?? cardRow.recipientChannel,
        recipientEmail: cardRow.recipient_email ?? cardRow.recipientEmail,
        recipientPhone: cardRow.recipient_phone ?? cardRow.recipientPhone,

        isAnonymous: !!(cardRow.is_anonymous ?? cardRow.isAnonymous),
        isVoid: !!(cardRow.is_void ?? cardRow.isVoid),

        messageText: cardRow.message_text ?? cardRow.messageText,
        messageCiphertext: cardRow.message_ciphertext ?? cardRow.messageCiphertext,
        messageNonce: cardRow.message_nonce ?? cardRow.messageNonce,
        messageAlg: cardRow.message_alg ?? cardRow.messageAlg,

        templateKey: cardRow.template_key ?? cardRow.templateKey,

        // ✅ this is what WandersCardPreview needs
        customization,

        openedAt: cardRow.opened_at ?? cardRow.openedAt,
        lastOpenedAt: cardRow.last_opened_at ?? cardRow.lastOpenedAt,
        openCount: cardRow.open_count ?? cardRow.openCount,

        createdAt: cardRow.created_at ?? cardRow.createdAt,
        updatedAt: cardRow.updated_at ?? cardRow.updatedAt,
      }
    : null;

  return {
    id: row.id,
    cardId: row.card_id ?? row.cardId,

    ownerActorId: row.owner_actor_id ?? row.ownerActorId,
    ownerUserId: row.owner_user_id ?? row.ownerUserId,
    ownerAnonId: row.owner_anon_id ?? row.ownerAnonId,

    ownerRole: row.owner_role ?? row.ownerRole,
    folder: row.folder,
    pinned: !!row.pinned,
    archived: !!row.archived,
    isRead: !!(row.is_read ?? row.isRead),
    readAt: row.read_at ?? row.readAt,

    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,

    card,
  };
}
