// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersCardPreview.jsx
// ============================================================================
// WANDERS COMPONENT — CARD PREVIEW
// UI-only: renders a draft payload and/or a domain card.
// No DAL, no controllers, no derived permissions.
// ============================================================================

import React, { useMemo } from "react";
import { templates } from "@/features/wanders/components/cardstemplates/registry";

function getTemplateStyles(templateKey) {
  switch (templateKey) {
    case "cute":
      return {
        wrapper: "bg-pink-50 border-pink-200",
        title: "text-pink-700",
        accent: "text-pink-600",
      };
    case "spicy":
      return {
        wrapper: "bg-red-50 border-red-200",
        title: "text-red-700",
        accent: "text-red-600",
      };
    case "mystery":
      return {
        wrapper: "bg-gray-900 border-gray-700 text-white",
        title: "text-white",
        accent: "text-gray-200",
      };
    case "generic-minimal":
      return {
        wrapper: "bg-white border-gray-200",
        title: "text-gray-900",
        accent: "text-gray-700",
      };
    case "classic":
    default:
      return {
        wrapper: "bg-rose-50 border-rose-200",
        title: "text-rose-900",
        accent: "text-rose-600",
      };
  }
}

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  let s = value.trim();
  if (!s) return null;

  // Unwrap up to 2 layers:
  // - jsonb object -> returned as object
  // - jsonb stored as a JSON string -> parse once yields object OR yields string
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

function findTemplateById(templateId) {
  const id = String(templateId || "").trim();
  if (!id) return null;

  for (const groupKey of Object.keys(templates)) {
    const list = templates[groupKey] || [];
    const tpl = list.find((t) => t?.id === id);
    if (tpl) return tpl;
  }
  return null;
}

/**
 * Convert a DB card row / payload into the shape your templates expect:
 * { toName, fromName, message, sendAnonymously, accent?, company?, ... }
 */
function toTemplateData({ templateKey, isAnonymous, customization, messageText, toName, fromName }) {
  const data = {
    toName: (toName ?? "").toString(),
    fromName: (fromName ?? "").toString(),

    // generic cards use this
    message: (messageText ?? "").toString(),

    sendAnonymously: !!isAnonymous,
  };

  if (customization && typeof customization === "object") {
    if (customization.accent !== undefined) data.accent = customization.accent;
    if (customization.company !== undefined) data.company = customization.company;

    // ✅ Photo: pull overlay text from customization (what you save in DB)
    data.title = String(customization.title ?? customization.card_title ?? customization.cardTitle ?? "").trim();
    data.message = String(customization.message ?? customization.body ?? customization.text ?? data.message ?? "").trim();

    // ✅ Photo: support all variants you are saving
    data.imageUrl =
      customization.imageUrl ??
      customization.image_url ?? // <-- your DB row uses this
      customization.imageURL ??
      null;

    data.imageDataUrl =
      customization.imageDataUrl ??
      customization.image_data_url ??
      null;
  }

  return data;
}

/**
 * WandersCardPreview
 * Renders a card preview from either:
 * - `payload` (draft) OR
 * - `card` (domain-safe card)
 *
 * Priority: payload overrides card.
 *
 * Supports snake_case from DB + customization as JSON string.
 *
 * If template exists in registry, renders template.Preview (pretty).
 * Otherwise renders the generic preview (fallback).
 */
export function WandersCardPreview({
  payload,
  draftPayload,
  card,
  className = "",
  titleText = "Wanders",
}) {
  const view = useMemo(() => {
    const p = payload ?? draftPayload ?? null;
    const c = card ?? null;

    const templateKey =
      p?.templateKey ??
      p?.template_key ??
      c?.templateKey ??
      c?.template_key ??
      "classic";

    const isAnonymous =
      p?.isAnonymous ??
      p?.is_anonymous ??
      c?.isAnonymous ??
      c?.is_anonymous ??
      false;

    // ✅ FIX: support customizationJson too (payload + card)
    const pCustomizationRaw =
      p?.customization ??
      p?.customization_json ??
      p?.customizationJson ??
      null;

    const cCustomizationRaw =
      c?.customization ??
      c?.customization_json ??
      c?.customizationJson ??
      null;

    const pCustomization = safeParseJson(pCustomizationRaw) ?? pCustomizationRaw ?? {};
    const cCustomization = safeParseJson(cCustomizationRaw) ?? cCustomizationRaw ?? {};

    const customization =
      pCustomization && typeof pCustomization === "object"
        ? pCustomization
        : cCustomization && typeof cCustomization === "object"
        ? cCustomization
        : {};

    const toName =
      customization?.toName ??
      customization?.to_name ??
      p?.toName ??
      p?.to_name ??
      c?.toName ??
      c?.to_name ??
      null;

    const fromName =
      customization?.fromName ??
      customization?.from_name ??
      p?.fromName ??
      p?.from_name ??
      c?.fromName ??
      c?.from_name ??
      null;

    const messageText =
      p?.messageText ??
      p?.message_text ??
      c?.messageText ??
      c?.message_text ??
      "";

    return {
      templateKey,
      isAnonymous,
      toName,
      fromName,
      messageText,
      customization,
    };
  }, [payload, draftPayload, card]);

  // ---------------------------------------------------------------------------
  // 1) If template is found in registry, render its Preview (the real card look)
  // ---------------------------------------------------------------------------
  const registryTemplate = useMemo(() => findTemplateById(view.templateKey), [view.templateKey]);

  if (registryTemplate?.Preview) {
    const data = toTemplateData({
      templateKey: view.templateKey,
      isAnonymous: view.isAnonymous,
      customization: view.customization,
      messageText: view.messageText,
      toName: view.toName,
      fromName: view.fromName,
    });

    return (
      <div className={["w-full", className].join(" ")}>
        <registryTemplate.Preview data={data} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2) Fallback: your original generic preview box
  // ---------------------------------------------------------------------------
  const styles = getTemplateStyles(view.templateKey);

  const displayTo = (view.toName || "").trim();
  const fromTrimmed = (view.fromName || "").trim();
  const displayFrom = view.isAnonymous ? "Anonymous 💌" : fromTrimmed || "Someone 💌";
  const displayMsg = (view.messageText || "").trim();

  // ✅ UPDATED: support saved URLs too (Cloudflare R2)
  const bgImage =
    view.customization?.imageUrl ||
    view.customization?.image_url ||
    view.customization?.imageDataUrl ||
    view.customization?.image_data_url ||
    null;

  const isMystery = view.templateKey === "mystery";
  const hasImage = !!bgImage;

  const panelClass = isMystery
    ? ["bg-black/55", hasImage ? "backdrop-blur-md" : "", "border border-white/15", "text-white"].join(" ")
    : [
        hasImage ? "bg-white/70 backdrop-blur-md border border-white/40" : "bg-white border border-black/5",
        "text-black",
      ].join(" ");

  const headerTextClass = isMystery ? "text-gray-200" : "text-gray-700";
  const messageTextClass = isMystery ? "text-white" : "text-gray-900";

  return (
    <div className={["relative overflow-hidden rounded-xl border shadow-sm", styles.wrapper, className].join(" ")}>
      {bgImage ? <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}

      {bgImage ? (
        <div className={["absolute inset-0", isMystery ? "bg-black/35" : "bg-black/25"].join(" ")} />
      ) : null}

      <div className={["relative z-10 m-3 rounded-xl p-4", panelClass].join(" ")}>
        <div className="flex items-center justify-between gap-3">
          <div className={["text-sm", headerTextClass].join(" ")}>
            {displayTo ? `To: ${displayTo}` : "To: (someone special)"}
          </div>

          <div className="flex items-center gap-3">
            <div className={["text-sm font-semibold opacity-80", styles.title].join(" ")}>{titleText}</div>
          </div>
        </div>

        <div className={["mt-4 whitespace-pre-wrap text-base leading-relaxed", messageTextClass].join(" ")}>
          {displayMsg ? displayMsg : "Write your message…"}
        </div>

        <div className={["mt-4 text-sm", headerTextClass].join(" ")}>From: {displayFrom}</div>
      </div>
    </div>
  );
}

export default WandersCardPreview;
