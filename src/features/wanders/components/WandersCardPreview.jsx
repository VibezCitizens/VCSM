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

function listRegistryKeys() {
  const keys = [];
  for (const groupKey of Object.keys(templates || {})) {
    const list = templates?.[groupKey] || [];
    for (const t of list) {
      if (t?.id) keys.push(String(t.id));
    }
  }
  return keys;
}

function normalizeTemplateKey(k) {
  return String(k || "").trim();
}

function findTemplateById(templateId) {
  const id = normalizeTemplateKey(templateId);
  if (!id) return null;

  for (const groupKey of Object.keys(templates || {})) {
    const list = templates?.[groupKey] || [];
    const tpl = list.find((t) => String(t?.id) === id);
    if (tpl) return tpl;
  }
  return null;
}

// ✅ DEBUG: try common aliases without changing DB values
function findTemplateWithAliases(templateId) {
  const id = normalizeTemplateKey(templateId);
  if (!id) return { tpl: null, usedKey: null, tried: [] };

  const tried = [];
  const candidates = [id, id.replace(/\./g, "-"), id.replace(/-/g, ".")].filter(Boolean);

  // de-dupe in order
  const uniq = [];
  for (const c of candidates) {
    if (!uniq.includes(c)) uniq.push(c);
  }

  for (const c of uniq) {
    tried.push(c);
    const tpl = findTemplateById(c);
    if (tpl) return { tpl, usedKey: c, tried };
  }

  return { tpl: null, usedKey: null, tried };
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
    data.imageUrl = customization.imageUrl ?? customization.image_url ?? customization.imageURL ?? null;

    data.imageDataUrl = customization.imageDataUrl ?? customization.image_data_url ?? null;
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
export function WandersCardPreview({ payload, draftPayload, card, className = "", titleText = "Wanders" }) {
  const view = useMemo(() => {
    const p = payload ?? draftPayload ?? null;
    const c = card ?? null;

    const templateKey = p?.templateKey ?? p?.template_key ?? c?.templateKey ?? c?.template_key ?? "classic";

    const isAnonymous = p?.isAnonymous ?? p?.is_anonymous ?? c?.isAnonymous ?? c?.is_anonymous ?? false;

    // ✅ FIX: support customizationJson too (payload + card)
    const pCustomizationRaw = p?.customization ?? p?.customization_json ?? p?.customizationJson ?? null;
    const cCustomizationRaw = c?.customization ?? c?.customization_json ?? c?.customizationJson ?? null;

    // ✅ IMPORTANT FIX:
    // If payload is null, do NOT default pCustomization to {} (which wrongly wins over card customization).
    const pCustomization =
      p
        ? (safeParseJson(pCustomizationRaw) ?? pCustomizationRaw ?? {})
        : null;

    const cCustomization = safeParseJson(cCustomizationRaw) ?? cCustomizationRaw ?? {};

    // -----------------------------------------------------------------------
    // ✅ NEW: also allow photo fields saved at top-level (card/payload) to work
    // -----------------------------------------------------------------------
    const topImageUrl =
      p?.imageUrl ??
      p?.image_url ??
      p?.imageURL ??
      c?.imageUrl ??
      c?.image_url ??
      c?.imageURL ??
      null;

    const topImageDataUrl =
      p?.imageDataUrl ??
      p?.image_data_url ??
      c?.imageDataUrl ??
      c?.image_data_url ??
      null;

    // ✅ Choose customization object:
    // - payload wins ONLY when payload exists AND customization is an object
    // - otherwise use card customization
    const baseCustomization =
      (pCustomization && typeof pCustomization === "object")
        ? pCustomization
        : (cCustomization && typeof cCustomization === "object")
        ? cCustomization
        : {};

    // Merge in top-level image fields ONLY if customization doesn't already have them
    const customization = { ...(baseCustomization || {}) };

    const hasCustomImageUrl =
      customization?.imageUrl != null || customization?.image_url != null || customization?.imageURL != null;

    const hasCustomImageDataUrl =
      customization?.imageDataUrl != null || customization?.image_data_url != null;

    if (!hasCustomImageUrl && topImageUrl) {
      // keep both keys for maximum compatibility
      customization.imageUrl = topImageUrl;
      customization.image_url = topImageUrl;
    }

    if (!hasCustomImageDataUrl && topImageDataUrl) {
      customization.imageDataUrl = topImageDataUrl;
      customization.image_data_url = topImageDataUrl;
    }

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

    const messageText = p?.messageText ?? p?.message_text ?? c?.messageText ?? c?.message_text ?? "";

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
  const registryDebug = useMemo(() => {
    const res = findTemplateWithAliases(view.templateKey);
    return res;
  }, [view.templateKey]);

  const registryTemplate = registryDebug?.tpl ?? null;

  // ✅ DEBUG LOGS (safe: only logs when templateKey changes)
  useMemo(() => {
    try {
      const k = normalizeTemplateKey(view.templateKey);
      const keys = listRegistryKeys();

      const imageUrl = view?.customization?.imageUrl ?? view?.customization?.image_url ?? null;
      const imageDataUrl = view?.customization?.imageDataUrl ?? view?.customization?.image_data_url ?? null;

      console.log("[WandersCardPreview] templateKey =", k);
      console.log("[WandersCardPreview] template lookup tried =", registryDebug?.tried);
      console.log("[WandersCardPreview] template resolved key =", registryDebug?.usedKey);
      console.log("[WandersCardPreview] template resolved? =", !!registryTemplate, registryTemplate?.id);
      console.log("[WandersCardPreview] registry template ids =", keys);
      console.log("[WandersCardPreview] photo fields:", {
        imageUrl: imageUrl || null,
        image_url: view?.customization?.image_url ?? null,
        imageDataUrlLen: typeof imageDataUrl === "string" ? imageDataUrl.length : 0,
      });
    } catch {
      // ignore
    }
  }, [view.templateKey, registryDebug, registryTemplate, view.customization]);

  if (registryTemplate?.Preview) {
    const data = toTemplateData({
      templateKey: view.templateKey,
      isAnonymous: view.isAnonymous,
      customization: view.customization,
      messageText: view.messageText,
      toName: view.toName,
      fromName: view.fromName,
    });

    // ✅ DEBUG for template data
    useMemo(() => {
      try {
        console.log("[WandersCardPreview] template data =", {
          templateKey: view.templateKey,
          toName: data?.toName,
          fromName: data?.fromName,
          title: data?.title,
          message: data?.message,
          imageUrl: data?.imageUrl,
          imageDataUrlLen: typeof data?.imageDataUrl === "string" ? data.imageDataUrl.length : 0,
        });
      } catch {
        // ignore
      }
    }, [view.templateKey, data]);

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

  // ✅ DEBUG: fallback reason
  useMemo(() => {
    try {
      console.warn("[WandersCardPreview] FALLBACK used (no registry template)", {
        templateKey: view.templateKey,
        tried: registryDebug?.tried,
        usedKey: registryDebug?.usedKey,
        hasImage,
        bgImageType: typeof bgImage,
        bgImageLen: typeof bgImage === "string" ? bgImage.length : 0,
      });
    } catch {
      // ignore
    }
  }, [view.templateKey, registryDebug, hasImage, bgImage]);

  const panelClass = isMystery
    ? ["bg-black/55", hasImage ? "backdrop-blur-md" : "", "border border-white/15", "text-white"].join(" ")
    : [hasImage ? "bg-white/70 backdrop-blur-md border border-white/40" : "bg-white border border-black/5", "text-black"].join(" ");

  const headerTextClass = isMystery ? "text-gray-200" : "text-gray-700";
  const messageTextClass = isMystery ? "text-white" : "text-gray-900";

  return (
    <div className={["relative overflow-hidden rounded-xl border shadow-sm", styles.wrapper, className].join(" ")}>
      {bgImage ? <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}

      {bgImage ? <div className={["absolute inset-0", isMystery ? "bg-black/35" : "bg-black/25"].join(" ")} /> : null}

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
