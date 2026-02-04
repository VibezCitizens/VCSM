// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\model\lovedropCard.model.js
// ============================================================================
// LOVE DROP MODEL — CARD
// Contract: pure translator (DB row -> domain shape).
// ============================================================================

/**
 * @param {any} row raw vc.lovedrop_cards row
 */
export function lovedropCardFromRow(row) {
  if (!row) return null

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
    recipientEmail: row.recipient_email,
    recipientPhone: row.recipient_phone,
    recipientChannel: row.recipient_channel,

    isAnonymous: !!row.is_anonymous,

    messageText: row.message_text,
    messageCiphertext: row.message_ciphertext,
    messageNonce: row.message_nonce,
    messageAlg: row.message_alg,

    templateKey: row.template_key,
    customization: row.customization ?? {},

    openedAt: row.opened_at,
    lastOpenedAt: row.last_opened_at,
    openCount: row.open_count ?? 0,

    senderClaimToken: row.sender_claim_token,
    recipientClaimToken: row.recipient_claim_token,

    isVoid: !!row.is_void,
  }
}
