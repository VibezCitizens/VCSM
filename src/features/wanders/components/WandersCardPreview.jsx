// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersCardPreview.jsx
// ============================================================================
// WANDERS COMPONENT — CARD PREVIEW
// UI-only: renders a draft payload and/or a domain card.
// No DAL, no controllers, no derived permissions.
// ============================================================================

import React, { useMemo } from "react";
import { templates } from "@/features/wanders/components/cardstemplates/registry";

/**
 * NOTE:
 * - This file no longer emits Tailwind utility classNames.
 * - It uses inline styles for the fallback renderer.
 * - Registry templates (registryTemplate.Preview) are left untouched.
 */

function getTemplateTheme(templateKey) {
  switch (templateKey) {
    case "cute":
      return {
        wrapperBg: "rgba(253,242,248,1)",
        wrapperBorder: "rgba(251,207,232,1)",
        titleColor: "rgba(190,24,93,1)",
        accentColor: "rgba(219,39,119,1)",
      };
    case "spicy":
      return {
        wrapperBg: "rgba(254,242,242,1)",
        wrapperBorder: "rgba(254,202,202,1)",
        titleColor: "rgba(185,28,28,1)",
        accentColor: "rgba(220,38,38,1)",
      };
    case "mystery":
      return {
        wrapperBg: "rgba(17,24,39,1)",
        wrapperBorder: "rgba(55,65,81,1)",
        titleColor: "rgba(255,255,255,1)",
        accentColor: "rgba(229,231,235,1)",
      };
    case "generic-minimal":
      return {
        wrapperBg: "rgba(255,255,255,1)",
        wrapperBorder: "rgba(229,231,235,1)",
        titleColor: "rgba(17,24,39,1)",
        accentColor: "rgba(55,65,81,1)",
      };
    case "classic":
    default:
      return {
        wrapperBg: "rgba(255,241,242,1)",
        wrapperBorder: "rgba(254,205,211,1)",
        titleColor: "rgba(136,19,55,1)",
        accentColor: "rgba(190,18,60,1)",
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
    message: (messageText ?? "").toString(),
    sendAnonymously: !!isAnonymous,
  };

  if (customization && typeof customization === "object") {
    if (customization.accent !== undefined) data.accent = customization.accent;
    if (customization.company !== undefined) data.company = customization.company;

    data.title = String(customization.title ?? customization.card_title ?? customization.cardTitle ?? "").trim();
    data.message = String(customization.message ?? customization.body ?? customization.text ?? data.message ?? "").trim();

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

    const templateKey = p?.templateKey ?? p?.template_key ?? c?.templateKey ?? c?.template_key ?? "classic";
    const isAnonymous = p?.isAnonymous ?? p?.is_anonymous ?? c?.isAnonymous ?? c?.is_anonymous ?? false;

    const pCustomizationRaw = p?.customization ?? p?.customization_json ?? p?.customizationJson ?? null;
    const cCustomizationRaw = c?.customization ?? c?.customization_json ?? c?.customizationJson ?? null;

    const pCustomization = p ? (safeParseJson(pCustomizationRaw) ?? pCustomizationRaw ?? {}) : null;
    const cCustomization = safeParseJson(cCustomizationRaw) ?? cCustomizationRaw ?? {};

    const topImageUrl =
      p?.imageUrl ?? p?.image_url ?? p?.imageURL ?? c?.imageUrl ?? c?.image_url ?? c?.imageURL ?? null;

    const topImageDataUrl =
      p?.imageDataUrl ?? p?.image_data_url ?? c?.imageDataUrl ?? c?.image_data_url ?? null;

    const baseCustomization =
      pCustomization && typeof pCustomization === "object"
        ? pCustomization
        : cCustomization && typeof cCustomization === "object"
        ? cCustomization
        : {};

    const customization = { ...(baseCustomization || {}) };

    const hasCustomImageUrl =
      customization?.imageUrl != null || customization?.image_url != null || customization?.imageURL != null;

    const hasCustomImageDataUrl =
      customization?.imageDataUrl != null || customization?.image_data_url != null;

    if (!hasCustomImageUrl && topImageUrl) {
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

    return { templateKey, isAnonymous, toName, fromName, messageText, customization };
  }, [payload, draftPayload, card]);

  // ---------------------------------------------------------------------------
  // 1) If template is found in registry, render its Preview (the real card look)
  // ---------------------------------------------------------------------------
  const registryDebug = useMemo(() => findTemplateWithAliases(view.templateKey), [view.templateKey]);
  const registryTemplate = registryDebug?.tpl ?? null;

  // ✅ DEBUG LOGS
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

    // keep your external className passthrough (if you have app CSS)
    return (
      <div className={className} style={{ width: "100%" }}>
        <registryTemplate.Preview data={data} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2) Fallback: generic preview (NO tailwind)
  // ---------------------------------------------------------------------------
  const theme = getTemplateTheme(view.templateKey);

  const displayTo = (view.toName || "").trim();
  const fromTrimmed = (view.fromName || "").trim();
  const displayFrom = view.isAnonymous ? "Anonymous 💌" : fromTrimmed || "Someone 💌";
  const displayMsg = (view.messageText || "").trim();

  const bgImage =
    view.customization?.imageUrl ||
    view.customization?.image_url ||
    view.customization?.imageDataUrl ||
    view.customization?.image_data_url ||
    null;

  const isMystery = view.templateKey === "mystery";
  const hasImage = !!bgImage;

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

  const styles = {
    wrapper: {
      position: "relative",
      overflow: "hidden",
      width: "100%",
      borderRadius: 12,
      border: `1px solid ${theme.wrapperBorder}`,
      background: theme.wrapperBg,
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      boxSizing: "border-box",
    },
    bgImg: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    bgOverlay: {
      position: "absolute",
      inset: 0,
      background: isMystery ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.25)",
    },
    panel: {
      position: "relative",
      zIndex: 1,
      margin: 12,
      borderRadius: 12,
      padding: 16,
      boxSizing: "border-box",
      border: isMystery
        ? "1px solid rgba(255,255,255,0.15)"
        : hasImage
        ? "1px solid rgba(255,255,255,0.40)"
        : "1px solid rgba(0,0,0,0.06)",
      background: isMystery
        ? "rgba(0,0,0,0.55)"
        : hasImage
        ? "rgba(255,255,255,0.70)"
        : "rgba(255,255,255,1)",
      color: isMystery ? "rgba(255,255,255,0.92)" : "rgba(17,24,39,1)",
      backdropFilter: hasImage || isMystery ? "blur(12px)" : "none",
      WebkitBackdropFilter: hasImage || isMystery ? "blur(12px)" : "none",
    },
    headerRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    toText: {
      fontSize: 13,
      color: isMystery ? "rgba(229,231,235,0.92)" : "rgba(55,65,81,0.95)",
      fontWeight: 700,
    },
    titleText: {
      fontSize: 13,
      fontWeight: 800,
      color: theme.titleColor,
      opacity: 0.9,
      whiteSpace: "nowrap",
    },
    message: {
      marginTop: 14,
      whiteSpace: "pre-wrap",
      fontSize: 16,
      lineHeight: 1.45,
      color: isMystery ? "rgba(255,255,255,0.95)" : "rgba(17,24,39,1)",
    },
    fromText: {
      marginTop: 14,
      fontSize: 13,
      color: isMystery ? "rgba(229,231,235,0.92)" : "rgba(55,65,81,0.95)",
      fontWeight: 700,
    },
  };

  return (
    <div className={className} style={styles.wrapper}>
      {bgImage ? <img src={bgImage} alt="" style={styles.bgImg} /> : null}
      {bgImage ? <div aria-hidden style={styles.bgOverlay} /> : null}

      <div style={styles.panel}>
        <div style={styles.headerRow}>
          <div style={styles.toText}>{displayTo ? `To: ${displayTo}` : "To: (someone special)"}</div>
          <div style={styles.titleText}>{titleText}</div>
        </div>

        <div style={styles.message}>{displayMsg ? displayMsg : "Write your message…"}</div>
        <div style={styles.fromText}>From: {displayFrom}</div>
      </div>
    </div>
  );
}

export default WandersCardPreview;
