// ============================================================================
// WANDERS CONTROLLER — CREATE CARD (Guest Auth)
// Owns meaning: create a sent card and seed sender mailbox.
// Identity = auth.users.id
// ============================================================================

import { nanoid } from "nanoid";

import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";

// You should point these to your *core* DAL once you migrate cards/mailbox.
// For now, these may still be legacy DAL paths in your repo.
import { createWandersCard as createWandersCardDAL } from "@/features/wanders/dal/wandersCards.dal";
import { createWandersMailboxItem } from "@/features/wanders/dal/wandersMailbox.dal";

function stripTrailingSlashes(url) {
  return String(url || "").replace(/\/+$/, "");
}

function getDefaultBaseUrl() {
  try {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  } catch {
    // Ignore window access failures and fallback to relative URL.
  }
  return "";
}

/**
 * @param {{
 *  realmId: string,
 *  templateKey?: string,
 *  isAnonymous?: boolean,
 *  messageText?: string|null,
 *  customization?: any,
 *  baseUrl?: string
 * }} input
 */
export async function createWandersCard(input) {
  const realmId = input?.realmId || null;
  if (!realmId) throw new Error("createWandersCard requires { realmId }");

  const user = await ensureGuestUser();

  const templateKey = String(input?.templateKey || "classic");
  const isAnonymous = !!input?.isAnonymous;
  const messageText = input?.messageText || null;
  const customization = input?.customization || {};
  const baseUrl = String(input?.baseUrl || "") || getDefaultBaseUrl();

  // DB payload (snake_case)
  const payload = {
    public_id: nanoid(21),
    realm_id: realmId,
    status: "sent",
    sent_at: new Date().toISOString(),

    // ✅ guest-auth identity
    sender_user_id: user.id,

    is_anonymous: isAnonymous,
    message_text: messageText,
    template_key: templateKey,
    customization,
    recipient_channel: "link",
  };

  // ✅ DAL call (raw row)
  const card = await createWandersCardDAL(payload);
  if (!card?.public_id) throw new Error("Card created but missing public_id");

  // Seed sender outbox
  await createWandersMailboxItem({
    cardId: card.id,
    ownerActorId: null,
    ownerUserId: user.id,
    ownerRole: "sender",
    folder: "outbox",
    isRead: true,
  });

  const url = baseUrl
    ? `${stripTrailingSlashes(baseUrl)}/wanders/v/${card.public_id}`
    : `/wanders/v/${card.public_id}`;

  return {
    id: card.id,
    publicId: card.public_id,
    url,
  };
}

export default createWandersCard;
