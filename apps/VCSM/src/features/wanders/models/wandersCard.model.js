// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersCard.model.js
// ============================================================================
// WANDERS MODEL — CARD
// Contract: map DB row -> UI-safe object.
// No side effects.
// ============================================================================

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  let s = value.trim();
  if (!s) return null;

  // Unwrap up to 2 layers (jsonb string, double-encoded)
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

export function toWandersCard(row) {
  if (!row) return null;

  const customizationRaw =
    row.customization ??
    row.customization_json ??
    row.customizationJson ??
    null;

  const customizationParsed = safeParseJson(customizationRaw);

  const customization =
    (customizationParsed && typeof customizationParsed === "object")
      ? customizationParsed
      : (customizationRaw && typeof customizationRaw === "object")
      ? customizationRaw
      : {};

  return {
    id: row.id,
    publicId: row.public_id,
    realmId: row.realm_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    sentAt: row.sent_at,
    expiresAt: row.expires_at,

    senderActorId: row.sender_actor_id,
    senderAnonId: row.sender_anon_id,
    recipientActorId: row.recipient_actor_id,
    recipientAnonId: row.recipient_anon_id,

    recipientChannel: row.recipient_channel,
    recipientEmail: row.recipient_email,
    recipientPhone: row.recipient_phone,

    isAnonymous: row.is_anonymous,

    messageText: row.message_text,
    messageCiphertext: row.message_ciphertext,
    messageNonce: row.message_nonce,
    messageAlg: row.message_alg,

    templateKey: row.template_key,

    // ✅ critical: customization must be an object in UI
    customization,

    openedAt: row.opened_at,
    lastOpenedAt: row.last_opened_at,
    openCount: row.open_count,

    isVoid: row.is_void,
    inboxId: row.inbox_id,
  };
}
