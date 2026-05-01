// Pure CTA helpers for WandersCardPublic view — no React, no side effects.

const ALLOWED_INTERNAL_CTA_ROUTES = [
  /^\/vport\/[a-z0-9][a-z0-9-]*\/card\/?(?:[?#].*)?$/i,
  /^\/profile\/[a-z0-9][a-z0-9-]*\/menu\/?(?:[?#].*)?$/i,
  /^\/profile\/[a-z0-9][a-z0-9-]*\/reviews\/?(?:[?#].*)?$/i,
];

function safeTrim(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  const source = value.trim();
  if (!source) return null;

  try {
    const parsed = JSON.parse(source);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeCtaType(value) {
  const raw = safeTrim(value).toLowerCase();
  if (raw === "visit_vport" || raw === "call" || raw === "message") return raw;
  return "none";
}

function defaultCtaLabel(type) {
  if (type === "visit_vport") return "View full profile";
  if (type === "call") return "Call now";
  if (type === "message") return "Send message";
  return "Open";
}

function sanitizeCtaUrl(rawUrl) {
  const value = safeTrim(rawUrl);
  if (!value) return null;

  if (value.startsWith("/")) {
    const allowed = ALLOWED_INTERNAL_CTA_ROUTES.some((pattern) => pattern.test(value));
    if (!allowed) return null;
    return { url: value, isExternal: false };
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return { url: parsed.toString(), isExternal: true };
  } catch {
    return null;
  }
}

export function readCardCta(card) {
  if (!card) return null;

  const customizationRaw =
    card?.customization ??
    card?.customization_json ??
    card?.customizationJson ??
    null;

  const customization =
    safeParseJson(customizationRaw) ??
    (customizationRaw && typeof customizationRaw === "object" ? customizationRaw : {});

  const ctaRaw = customization?.cta && typeof customization.cta === "object" ? customization.cta : null;
  if (!ctaRaw) return null;

  const ctaType = normalizeCtaType(ctaRaw?.type);
  if (ctaType === "none") return null;

  const vportSlug = safeTrim(customization?.vport_slug ?? customization?.vportSlug)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const rawUrl =
    safeTrim(ctaRaw?.url) ||
    (ctaType === "visit_vport" && vportSlug ? `/vport/${vportSlug}/card` : "");

  const safeUrl = sanitizeCtaUrl(rawUrl);
  if (!safeUrl) return null;

  return {
    type: ctaType,
    label: safeTrim(ctaRaw?.label) || defaultCtaLabel(ctaType),
    url: safeUrl.url,
    isExternal: safeUrl.isExternal,
    templateKey: safeTrim(card?.template_key ?? card?.templateKey) || null,
    campaign: safeTrim(customization?.campaign) || null,
  };
}
