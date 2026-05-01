// ============================================================================
// WANDERS CONTROLLER — PUBLISH FROM BUILDER (Guest Auth)
// Owns meaning: publish a sent card, upload image if needed, seed outbox.
// Identity = auth.users.id
// ============================================================================

import { nanoid } from "nanoid";

import { ensureGuestUser } from "@/features/wanders/core/controllers/ensureGuestUser.controller";

import { uploadMediaController } from '@media'
import { createMediaAssetController } from '@/features/media/controller/createMediaAsset.controller'
import { resolveVcsmAppIdDAL } from '@/features/media/dal/resolveAppId.read.dal'
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger'

// ✅ NEW ARCH: core write DALs
import { createWandersCard, updateWandersCard } from "@/features/wanders/core/dal/write/cards.write.dal";
import { createWandersMailboxItem } from "@/features/wanders/core/dal/write/mailbox.write.dal";

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

  // Unwrap up to 2 layers (matches your other helpers)
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
 * @param {{
 *  realmId: string,
 *  baseUrl?: string,
 *  payload: any
 * }} input
 */
export async function publishWandersFromBuilder({ realmId, baseUrl, payload, senderActorId = null }) {
  if (!realmId) throw new Error("publishWandersFromBuilder requires realmId");

  const user = await ensureGuestUser();

  // Support BOTH shapes:
  // 1) payload.message.{...}
  // 2) payload.{toName, fromName, messageText}
  const toName = payload?.toName ?? payload?.message?.toName ?? null;
  const fromName = payload?.fromName ?? payload?.message?.fromName ?? null;

  const messageText =
    payload?.messageText ??
    payload?.message_text ??
    payload?.message?.messageText ??
    payload?.message ?? // allow templates using data.message
    null;

  const templateKey =
    payload?.template_key ??
    payload?.templateKey ??
    payload?.templateId ??
    payload?.template?.id ??
    payload?.template?.key ??
    "classic";

  // Pre-generate public_id for image keying
  const publicId = nanoid(21);

  const rawCustomization =
    payload?.customization ??
    payload?.customization_json ??
    payload?.customizationJson ??
    null;

  const customizationObj =
    (safeParseJson(rawCustomization) ?? rawCustomization) && typeof (safeParseJson(rawCustomization) ?? rawCustomization) === "object"
      ? { ...(safeParseJson(rawCustomization) ?? rawCustomization) }
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

  // NOTE: allow existing base64 preview (optional) pre-upload
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
    imageUrl    = wandersUploadResult.publicUrl
    imageDataUrl = null
  }

  const insertPayload = {
    public_id: publicId,
    realm_id: realmId,
    status: "sent",
    sent_at: new Date().toISOString(),

    // ✅ guest-auth identity
    sender_user_id: user.id,

    is_anonymous: !!(payload?.is_anonymous ?? payload?.isAnonymous),
    message_text: safeTrim(messageText),
    template_key: String(templateKey),

    customization: {
      ...customizationObj,
      toName,
      fromName,
      kind: payload?.kind || customizationObj?.kind || "wanders",

      // ✅ store BOTH keys so UI/model/future code never misses it
      image_url: imageUrl || null,
      imageUrl: imageUrl || null,

      // ✅ also keep both keys for preview workflows (usually null after upload)
      image_data_url: imageDataUrl || null,
      imageDataUrl: imageDataUrl || null,
    },

    recipient_channel: "link",
  };

  // ✅ DAL call (new write DAL)
  const card = await createWandersCard(insertPayload);
  if (!card?.public_id) throw new Error("Card created but missing public_id");

  // ✅ Seed sender outbox (new mailbox write DAL; user-based)
  await createWandersMailboxItem({
    cardId: card.id,
    ownerActorId: null,
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
          await updateWandersCard({ cardId: card.id, patch: { media_asset_id: mediaAsset.id } })
          bugBunnyUploadStep('wanders_card', 'writeback:card', { cardId: card.id, mediaAssetId: mediaAsset.id })
        } else {
          bugBunnyUploadStep('wanders_card', 'writeback:card-skipped', { cardId: card.id })
        }
      } catch (e) {
        bugBunnyUploadError('wanders_card', 'writeback:failed', e, { cardId: card.id, senderActorId })
        if (import.meta.env?.DEV) console.warn('[publishWandersFromBuilder] media_assets write-back failed (non-fatal):', e?.message)
      }
    })()
  }

  const url = baseUrl
    ? `${stripTrailingSlashes(baseUrl)}/wanders/c/${card.public_id}`
    : `/wanders/c/${card.public_id}`;

  return { id: card.id, publicId: card.public_id, url };
}
