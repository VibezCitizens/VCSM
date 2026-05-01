import React, { useEffect, useMemo } from "react";
import {
  getTemplateTheme,
  safeParseJson,
  listRegistryKeys,
  normalizeTemplateKey,
  findTemplateWithAliases,
  toTemplateData,
  buildFallbackStyles,
} from "@/features/wanders/components/wandersCardPreview.model";

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
  useEffect(() => {
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

  const data = useMemo(() => {
    if (!registryTemplate?.Preview) return null;
    return toTemplateData({
      isAnonymous: view.isAnonymous,
      customization: view.customization,
      messageText: view.messageText,
      toName: view.toName,
      fromName: view.fromName,
    });
  }, [
    registryTemplate,
    view.isAnonymous,
    view.customization,
    view.messageText,
    view.toName,
    view.fromName,
  ]);

  useEffect(() => {
    if (!data) return;
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

  useEffect(() => {
    if (registryTemplate?.Preview) return;
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
  }, [view.templateKey, registryDebug, hasImage, bgImage, registryTemplate]);

  if (registryTemplate?.Preview && data) {
    return (
      <div className={className} style={{ width: "100%" }}>
        <registryTemplate.Preview data={data} />
      </div>
    );
  }

  const styles = buildFallbackStyles({ theme, isMystery, hasImage });

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
