// src/features/wanders/core/controllers/cards.controller.js
// ============================================================================
// WANDERS CORE CONTROLLER â€” CARDS
// Meaning: read cards + mark opened counters (guest-auth identity = auth.users.id)
// ============================================================================

import { nanoid } from "nanoid";

import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";
import { readPrimaryUserActorOwnerByUserIdDAL } from "@/features/wanders/core/dal/read/actorOwners.read.dal";
import {
  getWandersCardById as readCardByIdDAL,
  getWandersCardByPublicId as readCardByPublicIdDAL,
  listWandersCardsByInboxId as listByInboxDAL,
} from "@/features/wanders/core/dal/read/cards.read.dal";
import { createWandersCard, updateWandersCard as updateCardDAL } from "@/features/wanders/core/dal/write/cards.write.dal";
import { createWandersMailboxItem } from "@/features/wanders/core/dal/write/mailbox.write.dal";
import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
import { buildWandersImageKey } from "@/features/wanders/utils/buildWandersImageKey";

// NOTE: If you have events core DAL later, you can plug it in here.
// import { createWandersCardEvent } from "@/features/wanders/core/dal/write/events.write.dal";

export async function readWandersCardById(input) {
  const row = await readCardByIdDAL({ cardId: input.cardId });
  return row ?? null;
}

export async function readWandersCardByPublicId(input) {
  const row = await readCardByPublicIdDAL({ publicId: input.publicId });
  return row ?? null;
}

export async function listCardsForInbox(input) {
  const rows = await listByInboxDAL({
    inboxId: input.inboxId,
    limit: input.limit ?? 50,
  });
  return rows ?? [];
}

async function resolveUserActorId(userId) {
  if (!userId) return null;

  try {
    const row = await readPrimaryUserActorOwnerByUserIdDAL({ userId });
    return row?.actor_id ?? null;
  } catch (error) {
    // Fail-open: wanders still works user-based even if actor lookup fails
    console.warn("[resolveUserActorId] failed", error);
    return null;
  }
}

export async function markWandersCardOpened(input) {
  const nowIso = new Date().toISOString();

  await ensureGuestUser();

  const current = await readCardByIdDAL({ cardId: input.cardId });
  if (!current) throw new Error("Card not found");

  const nextCount = (current.open_count ?? 0) + 1;

  const updated = await updateCardDAL({
    cardId: input.cardId,
    patch: {
      opened_at: current.opened_at ?? nowIso,
      last_opened_at: nowIso,
      open_count: nextCount,
    },
  });

  return updated ?? null;
}

function stripTrailingSlashes(url) {
  return String(url || "").replace(/\/+$/, "");
}

function safeTrim(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  let s = value.trim();
  if (!s) return null;

  for (let i = 0; i < 2; i += 1) {
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
 * @param {{
 *  realmId: string,
 *  baseUrl?: string,
 *  payload: any
 * }} input
 */
export async function publishWandersFromBuilder({ realmId, baseUrl, payload }) {
  if (!realmId) throw new Error("publishWandersFromBuilder requires realmId");

  const user = await ensureGuestUser();
  const senderActorId = await resolveUserActorId(user.id);

  const toName = payload?.toName ?? payload?.message?.toName ?? null;
  const fromName = payload?.fromName ?? payload?.message?.fromName ?? null;

  const messageText =
    payload?.messageText ??
    payload?.message_text ??
    payload?.message?.messageText ??
    payload?.message ??
    null;

  const templateKey =
    payload?.template_key ??
    payload?.templateKey ??
    payload?.templateId ??
    payload?.template?.id ??
    payload?.template?.key ??
    "classic";

  const publicId = nanoid(21);

  const rawCustomization =
    payload?.customization ??
    payload?.customization_json ??
    payload?.customizationJson ??
    null;

  const parsedCustomization = safeParseJson(rawCustomization) ?? rawCustomization;
  const customizationObj =
    parsedCustomization && typeof parsedCustomization === "object"
      ? { ...parsedCustomization }
      : {};

  const imageFile =
    payload?.imageFile ??
    payload?.image_file ??
    customizationObj?.imageFile ??
    customizationObj?.image_file ??
    null;

  let imageUrl =
    payload?.imageUrl ??
    payload?.image_url ??
    customizationObj?.imageUrl ??
    customizationObj?.image_url ??
    null;

  let imageDataUrl =
    payload?.imageDataUrl ??
    payload?.image_data_url ??
    customizationObj?.imageDataUrl ??
    customizationObj?.image_data_url ??
    null;

  if (!imageUrl && imageFile) {
    const key = buildWandersImageKey({ publicId, file: imageFile });
    const upload = await uploadToCloudflare(imageFile, key);
    if (upload?.error) throw new Error(upload.error);
    imageUrl = upload?.url || null;
    imageDataUrl = null;
  }

  const insertPayload = {
    public_id: publicId,
    realm_id: realmId,
    status: "sent",
    sent_at: new Date().toISOString(),
    sender_user_id: user.id,
    sender_actor_id: senderActorId || null,
    is_anonymous: !!(payload?.is_anonymous ?? payload?.isAnonymous),
    message_text: safeTrim(messageText),
    template_key: String(templateKey),
    customization: {
      ...customizationObj,
      toName,
      fromName,
      kind: payload?.kind || customizationObj?.kind || "wanders",
      image_url: imageUrl || null,
      imageUrl: imageUrl || null,
      image_data_url: imageDataUrl || null,
      imageDataUrl: imageDataUrl || null,
    },
    recipient_channel: "link",
  };

  const card = await createWandersCard(insertPayload);
  if (!card?.public_id) throw new Error("Card created but missing public_id");

  await createWandersMailboxItem({
    cardId: card.id,
    ownerActorId: senderActorId || null,
    ownerUserId: user.id,
    ownerRole: "sender",
    folder: "outbox",
    isRead: true,
  });

  const url = baseUrl
    ? `${stripTrailingSlashes(baseUrl)}/wanders/c/${card.public_id}`
    : `/wanders/c/${card.public_id}`;

  return { id: card.id, publicId: card.public_id, url };
}
