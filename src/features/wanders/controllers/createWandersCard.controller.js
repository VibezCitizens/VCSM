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

async function ensureGuestSession(supabase) {
  const { data: sessData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;

  if (sessData?.session?.user?.id) return sessData.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  if (!data?.session?.user?.id) {
    throw new Error("Failed to establish guest session");
  }

  return data.session;
}

export async function createWandersCard(input) {
  const supabase = getWandersSupabase(); // ✅ Wanders client (isolated storageKey)

  const realmId = input?.realmId || null;
  if (!realmId) throw new Error("createWandersCard requires { realmId }");

  const templateKey = String(input?.templateKey || "classic");
  const isAnonymous = !!input?.is_anonymous ?? !!input?.isAnonymous; // tolerate either
  const messageText = input?.messageText ?? input?.message_text ?? null;
  const customization = input?.customization || {};
  const baseUrl = String(input?.baseUrl || "") || getDefaultBaseUrl();

  // ✅ Option A: guest user is an anon auth.users row
  const session = await ensureGuestSession(supabase);
  const userId = session.user.id;

  const payload = {
    public_id: nanoid(21),
    realm_id: realmId,
    status: "sent",
    sent_at: new Date().toISOString(),

    // ✅ schema-backed identity
    sender_user_id: userId,

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
  if (!card?.id || !card?.public_id) throw new Error("Card created but missing id/public_id");

  // ✅ outbox item tied to the same auth user (anon or upgraded later)
  const { error: mbErr } = await supabase
    .schema("wanders")
    .from("mailbox_items")
    .insert({
      card_id: card.id,
      owner_user_id: userId,
      owner_role: "sender",
      folder: "outbox",
      is_read: true,
    });

  if (mbErr) throw mbErr;

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
