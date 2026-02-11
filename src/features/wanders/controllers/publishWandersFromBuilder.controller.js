// src/features/wanders/controllers/publishWandersFromBuilder.controller.js
import { getWandersSupabase } from "../services/wandersSupabaseClient";
import { nanoid } from "nanoid";

import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
import { buildWandersImageKey } from "@/features/wanders/utils/buildWandersImageKey";

function stripTrailingSlashes(url) {
  return String(url || "").replace(/\/+$/, "");
}

function safeTrim(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export async function publishWandersFromBuilder({ realmId, senderAnonId, baseUrl, payload }) {
  if (!realmId) throw new Error("publishWandersFromBuilder requires realmId");

  const supabase = getWandersSupabase();

  // Support BOTH shapes:
  // 1) payload.message.{...}
  // 2) payload.{toName, fromName, messageText}
  const toName = payload?.toName ?? payload?.message?.toName ?? null;
  const fromName = payload?.fromName ?? payload?.message?.fromName ?? null;

  // ✅ FIX: accept templates that use "message" (valentines-romantic uses data.message)
  const messageText =
    payload?.messageText ??
    payload?.message_text ??
    payload?.message?.messageText ??
    payload?.message?.messageText ??
    payload?.message ?? // ✅ <-- important
    null;

  // ✅ Support multiple ways templates might provide template identity
  const templateKey =
    payload?.template_key ??
    payload?.templateKey ??
    payload?.templateId ??
    payload?.template?.id ??
    payload?.template?.key ??
    "classic";

  // ✅ Pre-generate public_id so we can upload under wanders/cards/<publicId>/...
  const publicId = nanoid(21);

  // ✅ Pull image file (photo template should pass imageFile through)
  // Accept multiple possible locations just in case
  const imageFile =
    payload?.imageFile ??
    payload?.image_file ??
    payload?.customization?.imageFile ??
    payload?.customization?.image_file ??
    null;

  // ✅ If you already have an image_url (maybe uploaded earlier), respect it
  let imageUrl =
    payload?.imageUrl ??
    payload?.image_url ??
    payload?.customization?.imageUrl ??
    payload?.customization?.image_url ??
    null;

  // ✅ Upload to Cloudflare R2 if we have a File/Blob and no URL yet
  if (!imageUrl && imageFile) {
    const key = buildWandersImageKey({ publicId, file: imageFile });
    const up = await uploadToCloudflare(imageFile, key);
    if (up?.error) throw new Error(up.error);
    imageUrl = up?.url || null;
  }

  const insertPayload = {
    public_id: publicId,
    realm_id: realmId,
    status: "sent",
    sent_at: new Date().toISOString(),

    sender_anon_id: senderAnonId || null,
    is_anonymous: !!(payload?.is_anonymous ?? payload?.isAnonymous),

    // ✅ ensure we store trimmed text or null
    message_text: safeTrim(messageText),

    // ✅ IMPORTANT: DB column is template_key (snake_case)
    template_key: String(templateKey),

    customization: {
      ...(payload?.customization || {}),
      toName,
      fromName,
      kind: payload?.kind || "wanders",

      // ✅ Save real URL for Sent/Public preview
      image_url: imageUrl || null,
    },

    recipient_channel: "link",
  };

  // === DEBUG START ===
  console.groupCollapsed("[wanders] publishWandersFromBuilder");
  console.log("realmId:", realmId);
  console.log("senderAnonId:", senderAnonId);
  console.log("payload:", payload);
  console.log("resolved templateKey:", templateKey);
  console.log("publicId:", publicId);
  console.log("imageFile:", imageFile ? { type: imageFile.type, size: imageFile.size, name: imageFile.name } : null);
  console.log("imageUrl:", imageUrl);
  console.log("insertPayload:", insertPayload);
  console.groupEnd();
  // === DEBUG END ===

  const { data: card, error } = await supabase
    .schema("wanders")
    .from("cards")
    .insert(insertPayload)
    .select("id, public_id")
    .single();

  // === DEBUG START ===
  if (error) {
    console.error("[wanders] cards insert error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  } else {
    console.log("[wanders] cards insert ok:", card);
  }
  // === DEBUG END ===

  if (error) throw error;
  if (!card?.public_id) throw new Error("Card created but missing public_id");

  if (senderAnonId) {
    const { error: mailboxErr } = await supabase.schema("wanders").from("mailbox_items").insert({
      card_id: card.id,
      owner_anon_id: senderAnonId,
      owner_role: "sender",
      folder: "outbox",
      is_read: true,
    });

    // === DEBUG START ===
    if (mailboxErr) {
      console.error("[wanders] mailbox_items insert error:", {
        message: mailboxErr.message,
        details: mailboxErr.details,
        hint: mailboxErr.hint,
        code: mailboxErr.code,
      });
    }
    // === DEBUG END ===

    if (mailboxErr) throw mailboxErr;
  }

  // ✅ IMPORTANT: keep consistent with screen + share utils (/wanders/c/:publicId)
  const url = baseUrl
    ? `${stripTrailingSlashes(baseUrl)}/wanders/c/${card.public_id}`
    : `/wanders/c/${card.public_id}`;

  return { id: card.id, publicId: card.public_id, url };
}
