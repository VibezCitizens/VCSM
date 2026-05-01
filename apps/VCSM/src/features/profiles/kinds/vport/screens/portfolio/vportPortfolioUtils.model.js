export const CONTENT_TYPES = Object.freeze({
  SINGLE: "single",
  GALLERY: "gallery",
  TRANSFORMATION: "transformation",
});

export const FILTER_KEYS = Object.freeze({
  ALL: "all",
  TRANSFORMATION: "type:transformation",
});

export const TRANSFORMATION_TERMS = [
  "before and after",
  "before & after",
  "before/after",
  "before-after",
  "transformation",
];

export function normalizeString(value) {
  return String(value ?? "").trim();
}

export function normalizeKey(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCase(value) {
  const safe = normalizeString(value);
  if (!safe) return "";

  return safe
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toSentenceCase(value) {
  const safe = normalizeString(value);
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

export function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeString).filter(Boolean))];
}

export function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

export function normalizeImageEntry(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const url = normalizeString(entry);
    return url ? { url } : null;
  }

  const url = normalizeString(entry?.url ?? entry?.media_url ?? entry?.src);
  if (!url) return null;

  return { url };
}

export function normalizeImageList(list) {
  return (Array.isArray(list) ? list : []).map(normalizeImageEntry).filter(Boolean);
}

export function readPortfolioMeta(post) {
  const candidates = [
    post?.portfolio,
    post?.portfolioMeta,
    post?.portfolio_meta,
    post?.meta?.portfolio,
  ];

  return candidates.map(asObject).find(Boolean) ?? null;
}

export function normalizeExplicitContentType(value) {
  const type = normalizeKey(value);

  if (type === CONTENT_TYPES.TRANSFORMATION) return CONTENT_TYPES.TRANSFORMATION;
  if (type === CONTENT_TYPES.GALLERY) return CONTENT_TYPES.GALLERY;
  if (type === CONTENT_TYPES.SINGLE) return CONTENT_TYPES.SINGLE;

  return null;
}

export function extractPostImages(post, portfolioMeta) {
  const explicitGallery = normalizeImageList(portfolioMeta?.galleryImages ?? portfolioMeta?.gallery_images);
  const explicitBefore = normalizeImageEntry(portfolioMeta?.beforeImage ?? portfolioMeta?.before_image);
  const explicitAfter = normalizeImageEntry(portfolioMeta?.afterImage ?? portfolioMeta?.after_image);

  if (explicitGallery.length) {
    return {
      images: explicitGallery,
      beforeImage: explicitBefore,
      afterImage: explicitAfter,
    };
  }

  const mediaImages = (Array.isArray(post?.media) ? post.media : [])
    .filter((item) => item?.type === "image" && normalizeString(item?.url))
    .map((item) => ({ url: item.url }));

  return {
    images: mediaImages,
    beforeImage: explicitBefore,
    afterImage: explicitAfter,
  };
}

export function formatDateLabel(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatPriceLabel(priceCents, currencyCode = "USD") {
  const amount = Number(priceCents);
  if (!Number.isFinite(amount) || amount < 0) return null;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

export function formatDurationLabel(durationMinutes) {
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) {
    return hours === 1 ? "1 hr" : `${hours} hrs`;
  }

  return `${hours} hr ${remainder} min`;
}
