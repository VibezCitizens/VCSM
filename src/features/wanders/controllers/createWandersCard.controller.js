// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\createWandersCard.controller.js

import { getWandersSupabase } from "../services/wandersSupabaseClient";
import { nanoid } from "nanoid";

function stripTrailingSlashes(url) {
  return String(url || "").replace(/\/+$/, "");
}

function getDefaultBaseUrl() {
  try {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  } catch {}
  return "";
}

export async function createWandersCard(input) {
  const supabase = getWandersSupabase(); // ✅ Wanders client

  const realmId = input?.realmId || null;
  if (!realmId) throw new Error("createWandersCard requires { realmId }");

  const senderAnonId = input?.senderAnonId || null;
  const templateKey = String(input?.templateKey || "classic");
  const isAnonymous = !!input?.isAnonymous;
  const messageText = input?.messageText || null;
  const customization = input?.customization || {};
  const baseUrl = String(input?.baseUrl || "") || getDefaultBaseUrl();

  const payload = {
    public_id: nanoid(21),
    realm_id: realmId,
    status: "sent",
    sent_at: new Date().toISOString(),
    sender_anon_id: senderAnonId,
    is_anonymous: isAnonymous,
    message_text: messageText,
    template_key: templateKey,
    customization,
    recipient_channel: "link",
  };

  const { data: card, error } = await supabase
    .schema("wanders")
    .from("cards")
    .insert(payload)
    .select("id, public_id")
    .single();

  if (error) throw error;
  if (!card?.public_id) throw new Error("Card created but missing public_id");

  if (senderAnonId) {
    await supabase
      .schema("wanders")
      .from("mailbox_items")
      .insert({
        card_id: card.id,
        owner_anon_id: senderAnonId,
        owner_role: "sender",
        folder: "outbox",
        is_read: true,
      });
  }

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
