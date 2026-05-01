import { templates } from "@/features/wanders/components/cardstemplates/registry";

export function getTemplateTheme(templateKey) {
  switch (templateKey) {
    case "cute":
      return {
        wrapperBg: "var(--vc-surface)",
        wrapperBorder: "rgba(255,105,198,0.25)",
        titleColor: "var(--vc-accent-pink)",
        accentColor: "var(--vc-accent-pink)",
      };
    case "spicy":
      return {
        wrapperBg: "var(--vc-surface)",
        wrapperBorder: "rgba(239,68,68,0.25)",
        titleColor: "var(--vc-error)",
        accentColor: "var(--vc-error)",
      };
    case "mystery":
      return {
        wrapperBg: "var(--vc-bg-0)",
        wrapperBorder: "var(--vc-border)",
        titleColor: "var(--vc-text)",
        accentColor: "var(--vc-text-soft)",
      };
    case "generic-minimal":
      return {
        wrapperBg: "var(--vc-surface)",
        wrapperBorder: "var(--vc-border)",
        titleColor: "var(--vc-text)",
        accentColor: "var(--vc-text-soft)",
      };
    case "classic":
    default:
      return {
        wrapperBg: "var(--vc-surface)",
        wrapperBorder: "rgba(255,105,198,0.20)",
        titleColor: "var(--vc-accent-pink)",
        accentColor: "var(--vc-accent-primary)",
      };
  }
}

export function safeParseJson(value) {
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

export function listRegistryKeys() {
  const keys = [];
  for (const groupKey of Object.keys(templates || {})) {
    const list = templates?.[groupKey] || [];
    for (const t of list) {
      if (t?.id) keys.push(String(t.id));
    }
  }
  return keys;
}

export function normalizeTemplateKey(k) {
  return String(k || "").trim();
}

export function findTemplateById(templateId) {
  const id = normalizeTemplateKey(templateId);
  if (!id) return null;

  for (const groupKey of Object.keys(templates || {})) {
    const list = templates?.[groupKey] || [];
    const tpl = list.find((t) => String(t?.id) === id);
    if (tpl) return tpl;
  }
  return null;
}

// try common aliases without changing DB values
export function findTemplateWithAliases(templateId) {
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

export function buildFallbackStyles({ theme, isMystery, hasImage }) {
  return {
    wrapper: {
      position: "relative",
      overflow: "hidden",
      width: "100%",
      borderRadius: 12,
      border: `1px solid ${theme.wrapperBorder}`,
      background: theme.wrapperBg,
      boxShadow: "var(--vc-shadow-card)",
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
        ? "1px solid var(--vc-border)"
        : hasImage
        ? "1px solid rgba(255,255,255,0.40)"
        : "1px solid var(--vc-border-subtle)",
      background: isMystery
        ? "rgba(0,0,0,0.55)"
        : hasImage
        ? "rgba(255,255,255,0.70)"
        : "var(--vc-surface)",
      color: "var(--vc-text)",
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
      color: "var(--vc-text-soft)",
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
      color: "var(--vc-text)",
    },
    fromText: {
      marginTop: 14,
      fontSize: 13,
      color: "var(--vc-text-soft)",
      fontWeight: 700,
    },
  };
}

/**
 * Convert a DB card row / payload into the shape your templates expect:
 * { toName, fromName, message, sendAnonymously, accent?, company?, ... }
 */
export function toTemplateData({ isAnonymous, customization, messageText, toName, fromName }) {
  const data = {
    toName: (toName ?? "").toString(),
    fromName: (fromName ?? "").toString(),
    message: (messageText ?? "").toString(),
    sendAnonymously: !!isAnonymous,
  };

  if (customization && typeof customization === "object") {
    // Pass template-specific customization fields through so specialized
    // preview components can render richer variants.
    for (const [key, value] of Object.entries(customization)) {
      if (data[key] === undefined) data[key] = value;
    }

    if (customization.accent !== undefined) data.accent = customization.accent;
    if (customization.company !== undefined) data.company = customization.company;

    data.title = String(customization.title ?? customization.card_title ?? customization.cardTitle ?? "").trim();
    data.message = String(customization.message ?? customization.body ?? customization.text ?? data.message ?? "").trim();

    data.imageUrl = customization.imageUrl ?? customization.image_url ?? customization.imageURL ?? null;
    data.imageDataUrl = customization.imageDataUrl ?? customization.image_data_url ?? null;

    if (!data.imageUrl && customization.hero_image_url) {
      data.imageUrl = customization.hero_image_url;
    }
  }

  return data;
}
