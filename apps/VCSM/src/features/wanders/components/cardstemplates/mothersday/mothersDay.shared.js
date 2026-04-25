export const MOTHERS_DAY_THEME = "mothers_day";
export const MOTHERS_DAY_CAMPAIGN = "mothers_day_2026";

export const MOTHERS_DAY_BACKGROUND_OPTIONS = [
  { value: "floral-soft", label: "Floral Soft" },
  { value: "midnight-bloom", label: "Midnight Bloom" },
  { value: "petal-glow", label: "Petal Glow" },
];

export const MOTHERS_DAY_PALETTE_OPTIONS = [
  { value: "violet-rose", label: "Violet Rose" },
  { value: "amethyst-floral", label: "Amethyst Floral" },
  { value: "sunset-orchid", label: "Sunset Orchid" },
];

export const MOTHERS_DAY_CTA_OPTIONS = [
  { value: "none", label: "No CTA" },
  { value: "visit_vport", label: "Visit VPORT" },
  { value: "call", label: "Call" },
  { value: "message", label: "Message" },
];

export function safeTrim(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeSlug(value) {
  const base = safeTrim(value).toLowerCase();
  if (!base) return "";
  return base.replace(/[^a-z0-9-]/g, "");
}

export function normalizeCtaType(value, fallback = "none") {
  const raw = safeTrim(value).toLowerCase();
  if (raw === "visit_vport" || raw === "call" || raw === "message" || raw === "none") {
    return raw;
  }
  return fallback;
}

export function defaultCtaLabel(type) {
  if (type === "visit_vport") return "View Offer";
  if (type === "call") return "Call";
  if (type === "message") return "Message";
  return "";
}

export function buildMothersDayCta({
  ctaType,
  ctaLabel,
  ctaUrl,
  vportSlug,
  fallbackType = "none",
} = {}) {
  const type = normalizeCtaType(ctaType, fallbackType);
  const slug = normalizeSlug(vportSlug);

  let url = safeTrim(ctaUrl);
  if (type === "visit_vport" && slug) {
    url = `/vport/${slug}/card`;
  }

  if (type === "none") {
    return {
      label: "",
      url: "",
      type: "none",
    };
  }

  const label = safeTrim(ctaLabel) || defaultCtaLabel(type);

  return {
    label,
    url,
    type,
  };
}

export function buildSearchableMotherDayMessage({ title, subtitle, message } = {}) {
  return [safeTrim(title), safeTrim(subtitle), safeTrim(message)]
    .filter(Boolean)
    .join(" — ");
}

export function buildMotherDayPayload({
  data,
  templateKey,
  kind = "mothers_day",
  fallbackTitle = "Happy Mother’s Day",
  fallbackBackground = "floral-soft",
  fallbackPalette = "violet-rose",
  fallbackCtaType = "none",
} = {}) {
  const sendAnonymously = !!data?.sendAnonymously;

  const title = safeTrim(data?.title) || fallbackTitle;
  const subtitle = safeTrim(data?.subtitle);
  const message = safeTrim(data?.message);
  const background = safeTrim(data?.background) || fallbackBackground;
  const palette = safeTrim(data?.palette) || fallbackPalette;

  const toName = safeTrim(data?.toName);
  const fromName = sendAnonymously ? "" : safeTrim(data?.fromName);

  const imageUrl = safeTrim(data?.imageUrl || data?.hero_image_url);
  const imageDataUrl = safeTrim(data?.imageDataUrl || data?.image_data_url);
  const vportSlug = normalizeSlug(data?.vportSlug || data?.vport_slug);

  const cta = buildMothersDayCta({
    ctaType: data?.ctaType || data?.cta?.type,
    ctaLabel: data?.ctaLabel || data?.cta?.label,
    ctaUrl: data?.ctaUrl || data?.cta?.url,
    vportSlug,
    fallbackType: fallbackCtaType,
  });

  return {
    kind,
    toName,
    fromName,
    messageText:
      buildSearchableMotherDayMessage({
        title,
        subtitle,
        message,
      }) || message || title,
    templateKey,
    isAnonymous: sendAnonymously,

    // Upload pipeline compatibility (controller supports these keys)
    imageFile: data?.imageFile || null,
    imageUrl: imageUrl || null,
    imageDataUrl: imageDataUrl || null,

    customization: {
      theme: MOTHERS_DAY_THEME,
      title,
      subtitle,
      message,
      background,
      palette,

      hero_image_url: imageUrl || null,
      heroImageUrl: imageUrl || null,

      // Keep old/new key compatibility for card image rendering
      image_url: imageUrl || null,
      imageUrl: imageUrl || null,
      image_data_url: imageDataUrl || null,
      imageDataUrl: imageDataUrl || null,

      cta,
      vport_slug: vportSlug || null,
      vportSlug: vportSlug || null,
      campaign: MOTHERS_DAY_CAMPAIGN,
    },
  };
}

export function resolveMotherDayPaletteClasses(palette) {
  const key = safeTrim(palette).toLowerCase();

  if (key === "amethyst-floral") {
    return {
      shell: "bg-gradient-to-br from-[#26113a] via-[#311455] to-[#1d102f] border-[#8b5cf6]/35",
      badge: "bg-violet-500/25 text-violet-100 border-violet-300/35",
      title: "text-violet-50",
      subtitle: "text-violet-200/85",
      body: "text-white/90",
    };
  }

  if (key === "sunset-orchid") {
    return {
      shell: "bg-gradient-to-br from-[#30112f] via-[#3f1550] to-[#23102d] border-fuchsia-300/35",
      badge: "bg-fuchsia-500/25 text-fuchsia-100 border-fuchsia-300/35",
      title: "text-fuchsia-50",
      subtitle: "text-fuchsia-200/85",
      body: "text-white/90",
    };
  }

  return {
    shell: "bg-gradient-to-br from-[#1d1331] via-[#2b1d47] to-[#191228] border-violet-300/35",
    badge: "bg-pink-500/25 text-pink-100 border-pink-300/35",
    title: "text-pink-50",
    subtitle: "text-pink-200/85",
    body: "text-white/90",
  };
}

