// src/features/wanders/core/controllers/cards.controller.js
// ============================================================================
// WANDERS CORE CONTROLLER â€” CARDS
// Meaning: read cards + mark opened counters (guest-auth identity = auth.users.id)
// ============================================================================

import { nanoid } from "nanoid";

import { ensureGuestUser } from "@/features/wanders/core/controllers/ensureGuestUser.controller";
import { readPrimaryUserActorOwnerByUserIdDAL } from "@/features/wanders/core/dal/read/actorOwners.read.dal";
import {
  getWandersCardById as readCardByIdDAL,
  getWandersCardByPublicId as readCardByPublicIdDAL,
  listWandersCardsByInboxId as listByInboxDAL,
} from "@/features/wanders/core/dal/read/cards.read.dal";
import { createWandersCard, updateWandersCard as updateCardDAL } from "@/features/wanders/core/dal/write/cards.write.dal";
import { createWandersMailboxItem } from "@/features/wanders/core/dal/write/mailbox.write.dal";
import { createWandersCardEvent } from "@/features/wanders/core/dal/write/events.write.dal";
import { uploadMediaController } from '@media'
import { createMediaAssetController } from '@/features/media/controller/createMediaAsset.controller'
import { resolveVcsmAppIdDAL } from '@/features/media/dal/resolveAppId.read.dal'
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger'

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

function normalizeCtaType(value) {
  const s = String(value || "").trim().toLowerCase();
  if (s === "visit_vport" || s === "call" || s === "message") return s;
  return "none";
}

export async function trackWandersCardCtaClicked(input = {}) {
  const cardId = safeTrim(input?.cardId);
  if (!cardId) return null;

  let user = null;
  try {
    user = await ensureGuestUser();
  } catch (_ERR) {
    // Best effort only; keep CTA navigation unblocked.
    void _ERR;
  }

  try {
    return await createWandersCardEvent({
      cardId,
      userId: user?.id ?? null,
      actorId: null,
      eventType: "opened",
      meta: {
        action: "cta_clicked",
        cta_type: normalizeCtaType(input?.ctaType),
        cta_url: safeTrim(input?.ctaUrl),
        template_key: safeTrim(input?.templateKey),
        campaign: safeTrim(input?.campaign),
      },
    });
  } catch (error) {
    console.warn("[trackWandersCardCtaClicked] failed", error);
    return null;
  }
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

  let wandersUploadResult = null
  if (!imageUrl && imageFile) {
    wandersUploadResult = await uploadMediaController({
      file: imageFile,
      scope: 'wanders_card',
      ownerActorId: user.id,
      opts: { extraPath: 'cards' },
    })
    imageUrl = wandersUploadResult.publicUrl
    imageDataUrl = null
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

  if (wandersUploadResult && senderActorId && card?.id) {
    ;(async () => {
      bugBunnyUploadStep('wanders_card', 'writeback:start', { cardId: card.id, senderActorId })
      try {
        const appId = await resolveVcsmAppIdDAL()
        const mediaAsset = await createMediaAssetController({
          mediaUploadResult:  wandersUploadResult,
          ownerActorId:       senderActorId,
          createdByActorId:   senderActorId,
          scope:              'wanders_card',
          scopeId:            card.id,
          mediaRole:          'original',
          appId,
        })
        if (mediaAsset?.id) {
          await updateCardDAL({ cardId: card.id, patch: { media_asset_id: mediaAsset.id } })
          bugBunnyUploadStep('wanders_card', 'writeback:card', { cardId: card.id, mediaAssetId: mediaAsset.id })
        }
      } catch (e) {
        bugBunnyUploadError('wanders_card', 'writeback:failed', e, { cardId: card.id })
        if (import.meta.env?.DEV) console.warn('[cards.controller/publishWandersFromBuilder] media_assets write-back failed (non-fatal):', e?.message)
      }
    })()
  }

  const url = baseUrl
    ? `${stripTrailingSlashes(baseUrl)}/wanders/c/${card.public_id}`
    : `/wanders/c/${card.public_id}`;

  return { id: card.id, publicId: card.public_id, url };
}
